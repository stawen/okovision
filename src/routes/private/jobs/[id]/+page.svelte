<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { uiMessages } from '#lib/i18n.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let updatedJob = $state<PageProps['data']['job'] | null>(null);
	let job = $derived(updatedJob ?? data.job);
	let pollError = $state(false);
	let text = $derived(uiMessages(data.language));
	let label = $derived({
		queued: text.jobQueued,
		running: text.jobRunning,
		completed: text.jobCompleted,
		failed: text.jobFailed,
		interrupted: text.jobInterrupted
	}[job.status]);

	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		const controller = new AbortController();
		const poll = async () => {
			try {
				const response = await fetch(resolve('/private/api/jobs/[id]', { id: job.id }), {
					signal: controller.signal,
					headers: { accept: 'application/json' }
				});
				if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
					throw new Error('Job status unavailable');
				}
				updatedJob = await response.json();
				pollError = false;
				if (job.status === 'queued' || job.status === 'running') timer = setTimeout(poll, 2000);
			} catch {
				if (!controller.signal.aborted) pollError = true;
			}
		};
		if (job.status === 'queued' || job.status === 'running') timer = setTimeout(poll, 2000);
		return () => {
			controller.abort();
			clearTimeout(timer);
		};
	});
</script>

<svelte:head>
	<title>{text.jobTitle} — OkoVision</title>
</svelte:head>

<main id="contenu" class="container">
	<h2>{text.jobTitle}</h2>
	{#if job.filename}<p>{job.filename}</p>{/if}
	<p role="status" aria-live="polite">{label}</p>
	{#if job.progress}
		<p>{text.jobProgress} : {job.progress.completed} / {job.progress.total}</p>
	{/if}
	{#if job.result}
		<p>{text.jobImported} : {job.result.imported}</p>
	{/if}
	{#if pollError}<p role="alert">{text.jobPollError}</p>{/if}
	<form method="GET"><button type="submit">{text.jobRefresh}</button></form>
	<p><a href={resolve('/private/configuration/import-boiler')}>{text.jobBack}</a></p>
</main>
