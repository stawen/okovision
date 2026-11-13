<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { uiMessages } from '#lib/ui/i18n.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let processingFile = $state<string | null>(null);
	let importError = $state<string | null>(null);
	let feedback = $derived(importError ?? (form && 'error' in form ? form.error : null));
	let failed = $derived(Boolean(feedback));
	let controller: AbortController | undefined;

	onDestroy(() => controller?.abort());

	async function waitForImport(id: string, filename: string, signal: AbortSignal): Promise<void> {
		while (!signal.aborted) {
			const response = await fetch(resolve('/private/api/jobs/[id]', { id }), {
				headers: { accept: 'application/json' },
				signal
			});
			if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
				throw new Error('Job status unavailable');
			}
			const job: unknown = await response.json();
			if (!job || typeof job !== 'object' || !('status' in job)) throw new Error('Invalid job status');
			if (job.status === 'failed' || job.status === 'interrupted') {
				importError = job.status === 'failed' ? text.jobFailed : text.jobInterrupted;
				return;
			}
			if (job.status === 'completed') {
				if (!('result' in job) || !job.result || typeof job.result !== 'object'
					|| !('imported' in job.result) || typeof job.result.imported !== 'number'
					|| !Number.isSafeInteger(job.result.imported) || job.result.imported < 0) {
					throw new Error('Invalid job result');
				}
				const count = job.result.imported;
				const date = `${filename.slice(12, 14)}/${filename.slice(10, 12)}/${filename.slice(6, 10)}`;
				toast.success(text.boilerImportSuccess
					.replace('{date}', date)
					.replace('{count}', String(count))
					.replace('{plural}', count > 1 ? 's' : ''));
				return;
			}
			if (job.status !== 'queued' && job.status !== 'running') throw new Error('Invalid job status');
			await new Promise<void>((done) => setTimeout(done, 1500));
		}
	}

	const enhanceBoilerImport: SubmitFunction = ({ formData, cancel }) => {
		if (processingFile !== null) {
			cancel();
			return;
		}
		const file = formData.get('file');
		processingFile = typeof file === 'string' ? file : null;
		importError = null;
		controller = new AbortController();
		const signal = controller.signal;
		return async ({ result, update }) => {
			try {
				await update();
				if (result.type === 'success') {
					if (typeof result.data?.jobId !== 'string' || typeof file !== 'string') {
						throw new Error('Missing import job');
					}
					await waitForImport(result.data.jobId, file, signal);
				}
			} catch {
				if (!signal.aborted) importError = text.jobPollError;
			} finally {
				processingFile = null;
				controller = undefined;
			}
		};
	};
</script>

<svelte:head>
	<title>{text.boilerImportTitle} — OkoVision</title>
	<meta name="description" content={text.boilerImportDescription} />
</svelte:head>

<main id="contenu" class="container boiler-import-page">
	<h2>{text.boilerImportTitle}</h2>
	<p class="scope-description">{text.boilerImportDescription}</p>

	{#if feedback}
		<p class:boiler-import-error={failed} class="boiler-import-feedback" role={failed ? 'alert' : 'status'}>
			{feedback}
		</p>
	{/if}
	{#if form && 'jobId' in form && form.jobId}
		<noscript>
			<p class="boiler-import-feedback">
				{text.jobQueued}
				<a href={resolve('/private/jobs/[id]', { id: form.jobId })}>{text.jobTitle}</a>
			</p>
		</noscript>
	{/if}
	{#if data.loadError}
		<p class="boiler-import-feedback boiler-import-error" role="alert">{text.boilerImportLoadError}</p>
	{:else if data.files.length === 0}
		<p class="boiler-import-empty">{text.boilerImportNoFiles}</p>
	{:else}
		<div class="boiler-import-table-scroll">
			<table class="boiler-import-table">
				<thead>
					<tr>
						<th scope="col">{text.boilerImportFilename}</th>
						<th scope="col">{text.boilerImportAction}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.files as file (file.name)}
						<tr>
							<td>
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={file.url} target="_blank" rel="noreferrer">{file.name}</a>
							</td>
							<td>
								<form method="POST" action="?/import" use:enhance={enhanceBoilerImport}>
									<input type="hidden" name="file" value={file.name} />
									<button
										class="boiler-import-button"
										type="submit"
										aria-label={processingFile === file.name ? text.boilerImportProcessing : text.boilerImportSubmit}
										aria-busy={processingFile === file.name}
										title={processingFile === file.name ? text.boilerImportProcessing : text.boilerImportSubmit}
										disabled={processingFile !== null}
									>
										{#if processingFile === file.name}
											<span class="boiler-import-spinner" aria-hidden="true"></span>
										{:else}
											<svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
												<path
													d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
													stroke="currentColor"
													stroke-width="1.8"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										{/if}
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>
