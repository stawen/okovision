import { randomUUID } from 'node:crypto';
import { mkdir, open, readdir, readFile, realpath, rename, stat, unlink } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { collectBoiler, importManualFile } from './collection.ts';
import { isBoilerCsvFilename } from './boiler-import.ts';
import { logger } from './logger.ts';

const log = logger.child({ component: 'jobs' });
type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'interrupted';
type JobKind = 'collection' | 'import';

export interface Job {
	id: string;
	kind: JobKind;
	status: JobStatus;
	createdAt: string;
	updatedAt: string;
	author: string;
	filename?: string;
	progress?: { completed: number; total: number; day: string; dirty: boolean };
	result?: { imported: number; files?: number };
}

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class JobManager {
	private readonly jobs = new Map<string, Job>();
	private active: Promise<void> | undefined;
	private controller: AbortController | undefined;
	private stopping = false;
	private readonly directory: string;
	private enqueueTail = Promise.resolve();

	constructor(directory = process.env.JOBS_DIR || 'data/jobs', private readonly allowCollections = true) {
		this.directory = resolve(directory);
	}

	private runnable(job: Job): boolean {
		return job.status === 'queued' && (job.kind !== 'collection' || this.allowCollections);
	}

	private async save(job: Job): Promise<void> {
		const target = join(this.directory, `${job.id}.json`);
		const temporary = join(this.directory, `.${job.id}.${randomUUID()}.tmp`);
		const handle = await open(temporary, 'wx', 0o600);
		try {
			await handle.writeFile(JSON.stringify(job), 'utf8');
			await handle.sync();
		} finally {
			await handle.close();
		}
		try {
			await rename(temporary, target);
		} catch (error) {
			await unlink(temporary);
			throw error;
		}
		this.jobs.set(job.id, job);
	}

	async start(): Promise<void> {
		await mkdir(this.directory, { recursive: true, mode: 0o700 });
		const directory = await realpath(this.directory);
		const root = await realpath(process.cwd());
		const within = (parent: string, child: string) => {
			const path = relative(parent, child);
			return path === '' || (!path.startsWith('..') && !isAbsolute(path));
		};
		if (within(root, directory) && !within(resolve(root, 'data'), directory)) {
			throw new Error('Job directory must be outside the application or inside data/');
		}
		if (((await stat(directory)).mode & 0o077) !== 0) throw new Error('Job directory permissions must be private');
		const entries = await readdir(this.directory);
		for (const entry of entries) {
			if (!entry.endsWith('.json')) continue;
			const id = entry.slice(0, -5);
			if (!idPattern.test(id)) throw new Error('Invalid job filename');
			const value: unknown = JSON.parse(await readFile(join(this.directory, entry), 'utf8'));
			if (!value || typeof value !== 'object' || !('id' in value) || value.id !== id
				|| !('status' in value) || !['queued', 'running', 'completed', 'failed', 'interrupted'].includes(String(value.status))
				|| !('kind' in value) || !['collection', 'import'].includes(String(value.kind))
				|| !('createdAt' in value) || typeof value.createdAt !== 'string'
				|| !('updatedAt' in value) || typeof value.updatedAt !== 'string'
				|| !('author' in value) || typeof value.author !== 'string'
				|| (value.kind === 'import' && (!('filename' in value) || typeof value.filename !== 'string' || !isBoilerCsvFilename(value.filename)))) {
				throw new Error('Invalid persisted job');
			}
			const job = value as Job;
			if (job.status === 'running') {
				await this.save({ ...job, status: 'interrupted', updatedAt: new Date().toISOString() });
			} else {
				this.jobs.set(id, job);
			}
		}
		this.wake();
	}

	get(id: string): Job | undefined {
		if (!idPattern.test(id)) return undefined;
		const job = this.jobs.get(id);
		return job ? structuredClone(job) : undefined;
	}

	list(): Job[] {
		return [...this.jobs.values()]
			.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
			.slice(0, 100)
			.map((job) => structuredClone(job));
	}

	async enqueue(kind: JobKind, author: string, filename?: string): Promise<Job> {
		const previous = this.enqueueTail;
		let release!: () => void;
		this.enqueueTail = new Promise<void>((resolve) => { release = resolve; });
		await previous;
		try {
			if (this.stopping) throw new Error('Job manager stopping');
			if (kind === 'import' && (!filename || !isBoilerCsvFilename(filename))) throw new Error('Invalid filename');
			if (kind === 'collection') {
				const existing = [...this.jobs.values()].find((job) =>
					job.kind === 'collection' && (job.status === 'queued' || job.status === 'running'));
				if (existing) return structuredClone(existing);
			}
			const now = new Date().toISOString();
			const job: Job = {
				id: randomUUID(), kind, status: 'queued', createdAt: now, updatedAt: now, author,
				...(filename ? { filename } : {})
			};
			await this.save(job);
			this.wake();
			return structuredClone(job);
		} finally {
			release();
		}
	}

	private wake(): void {
		if (this.active || this.stopping) return;
		this.active = this.drain().catch((error: unknown) => {
			log.error('collectionFailed', error, { operation: 'queue' });
			this.stopping = true;
		}).finally(() => {
			this.active = undefined;
			if (!this.stopping && [...this.jobs.values()].some((job) => this.runnable(job))) {
				this.wake();
			}
		});
	}

	private async drain(): Promise<void> {
		while (!this.stopping) {
			const job = [...this.jobs.values()]
				.filter((item) => this.runnable(item))
				.sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
			if (!job) return;
			let current: Job = { ...job, status: 'running', updatedAt: new Date().toISOString() };
			await this.save(current);
			if (this.stopping) {
				await this.save({ ...current, status: 'interrupted', updatedAt: new Date().toISOString() });
				return;
			}
			this.controller = new AbortController();
			try {
				const dirtyJobs = job.kind === 'collection' ? [...this.jobs.values()].filter((item) =>
					item.id !== job.id && item.kind === 'collection'
					&& (item.status === 'failed' || item.status === 'interrupted') && item.progress?.dirty
				) : [];
				const dirtyDays = new Set(dirtyJobs.map((item) => item.progress!.day));
				const result = job.kind === 'collection'
					? await collectBoiler(this.controller.signal, async (completed, total, day, dirty) => {
						current = { ...current, progress: { completed, total, day, dirty }, updatedAt: new Date().toISOString() };
						await this.save(current);
					}, dirtyDays)
					: { imported: await importManualFile(job.filename!, this.controller.signal) };
				this.controller.signal.throwIfAborted();
				for (const previous of dirtyJobs) {
					this.controller.signal.throwIfAborted();
					await this.save({ ...previous, progress: { ...previous.progress!, dirty: false } });
				}
				this.controller.signal.throwIfAborted();
				await this.save({ ...current, status: 'completed', result, updatedAt: new Date().toISOString() });
				log.info('jobCompleted', { jobId: job.id, kind: job.kind });
			} catch (error) {
				log.error('collectionFailed', error, { jobId: job.id, kind: job.kind });
				await this.save({
					...current, status: this.controller.signal.aborted ? 'interrupted' : 'failed',
					updatedAt: new Date().toISOString()
				});
			} finally {
				this.controller = undefined;
			}
		}
	}

	async stop(): Promise<void> {
		this.stopping = true;
		await this.enqueueTail;
		this.controller?.abort(new Error('Server shutting down'));
		await this.active;
	}
}

const globalJobs = globalThis as typeof globalThis & { __okovisionJobs?: Promise<JobManager> };

export function getJobManager(allowCollections = true): Promise<JobManager> {
	globalJobs.__okovisionJobs ??= (async () => {
		const manager = new JobManager(undefined, allowCollections);
		await manager.start();
		return manager;
	})();
	return globalJobs.__okovisionJobs;
}
