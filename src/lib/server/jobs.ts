import { randomUUID } from 'node:crypto';
import { collectBoiler, importManualFile } from './collection.ts';
import { isBoilerCsvFilename } from './boiler-import.ts';
import { logger } from './logger.ts';

const log = logger.child({ component: 'jobs' });
const jobTtlMs = 60 * 60 * 1000;
type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'interrupted';
type JobKind = 'collection' | 'import';

export interface Job {
	id: string;
	kind: JobKind;
	status: JobStatus;
	createdAt: string;
	updatedAt: string;
	author: string;
	manual?: true;
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
	private readonly dirtyDays = new Set<string>();
	private enqueueTail = Promise.resolve();

	constructor(private readonly allowCollections = true) {}

	private runnable(job: Job): boolean {
		return job.status === 'queued' && (job.kind !== 'collection' || this.allowCollections || job.manual === true);
	}

	private update(job: Job): void {
		this.jobs.set(job.id, job);
	}

	private pruneExpiredJobs(now = Date.now()): void {
		for (const [id, job] of this.jobs) {
			if (job.status === 'queued' || job.status === 'running') continue;
			const updatedAt = Date.parse(job.updatedAt);
			if (!Number.isFinite(updatedAt) || now - updatedAt < jobTtlMs) continue;
			if (job.progress?.dirty) this.dirtyDays.add(job.progress.day);
			this.jobs.delete(id);
		}
	}

	get(id: string): Job | undefined {
		this.pruneExpiredJobs();
		if (!idPattern.test(id)) return undefined;
		const job = this.jobs.get(id);
		return job ? structuredClone(job) : undefined;
	}

	list(): Job[] {
		this.pruneExpiredJobs();
		return [...this.jobs.values()]
			.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
			.slice(0, 100)
			.map((job) => structuredClone(job));
	}

	async enqueue(kind: JobKind, author: string, filename?: string): Promise<Job> {
		return this.enqueueJob(kind, author, filename);
	}

	async enqueueCollection(author: string): Promise<Job> {
		return this.enqueueJob('collection', author, undefined, true);
	}

	private async enqueueJob(kind: JobKind, author: string, filename?: string, manual = false): Promise<Job> {
		const previous = this.enqueueTail;
		let release!: () => void;
		this.enqueueTail = new Promise<void>((resolve) => { release = resolve; });
		await previous;
		try {
			this.pruneExpiredJobs();
			if (this.stopping) throw new Error('Job manager stopping');
			if (kind === 'import' && (!filename || !isBoilerCsvFilename(filename))) throw new Error('Invalid filename');
			if (kind === 'collection') {
				// Manual and scheduled triggers share a single pending collection.
				const existing = [...this.jobs.values()].find((job) =>
					job.kind === 'collection' && (job.status === 'queued' || job.status === 'running'));
				if (existing) {
					if (manual && existing.status === 'queued' && !existing.manual) {
						const activated: Job = { ...existing, manual: true, author, updatedAt: new Date().toISOString() };
						this.update(activated);
						this.wake();
						return structuredClone(activated);
					}
					return structuredClone(existing);
				}
			}
			const now = new Date().toISOString();
			const job: Job = {
				id: randomUUID(), kind, status: 'queued', createdAt: now, updatedAt: now, author,
				...(manual ? { manual: true as const } : {}),
				...(filename ? { filename } : {})
			};
			this.update(job);
			this.wake();
			return structuredClone(job);
		} finally {
			release();
		}
	}

	private wake(): void {
		if (this.active || this.stopping) return;
		this.pruneExpiredJobs();
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
			this.pruneExpiredJobs();
			const job = [...this.jobs.values()]
				.filter((item) => this.runnable(item))
				.sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
			if (!job) return;
			let current: Job = { ...job, status: 'running', updatedAt: new Date().toISOString() };
			this.update(current);
			if (this.stopping) {
				this.update({ ...current, status: 'interrupted', updatedAt: new Date().toISOString() });
				return;
			}
			this.controller = new AbortController();
			try {
				const dirtyJobs = job.kind === 'collection' ? [...this.jobs.values()].filter((item) =>
					item.id !== job.id && item.kind === 'collection'
					&& (item.status === 'failed' || item.status === 'interrupted') && item.progress?.dirty
				) : [];
				const dirtyDays = new Set([
					...this.dirtyDays,
					...dirtyJobs.map((item) => item.progress!.day)
				]);
				const result = job.kind === 'collection'
					? await collectBoiler(this.controller.signal, async (completed, total, day, dirty) => {
						current = { ...current, progress: { completed, total, day, dirty }, updatedAt: new Date().toISOString() };
						this.update(current);
						if (dirty) this.dirtyDays.add(day);
						else this.dirtyDays.delete(day);
					}, dirtyDays)
					: { imported: await importManualFile(job.filename!, this.controller.signal) };
				this.controller.signal.throwIfAborted();
				for (const previous of dirtyJobs) {
					this.controller.signal.throwIfAborted();
					this.update({
						...previous,
						progress: { ...previous.progress!, dirty: false },
						updatedAt: new Date().toISOString()
					});
				}
				this.controller.signal.throwIfAborted();
				this.update({ ...current, status: 'completed', result, updatedAt: new Date().toISOString() });
				log.info('jobCompleted', { jobId: job.id, kind: job.kind });
			} catch (error) {
				log.error('collectionFailed', error, { jobId: job.id, kind: job.kind });
				this.update({
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
	globalJobs.__okovisionJobs ??= Promise.resolve(new JobManager(allowCollections));
	return globalJobs.__okovisionJobs;
}
