<script lang="ts">
	import { deserialize } from '$app/forms';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { uiMessages } from '#lib/ui/i18n.js';
	import { summaryDays } from '#lib/ui/daily-summaries.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let start = $state('');
	let end = $state('');
	let days = $state<string[]>([]);
	let selected = $state(false);
	let busy = $state(false);
	let currentDay = $state<string | null>(null);
	let successfulDay = $state<string | null>(null);
	let error = $state('');
	let status = $state('');
	let rowErrors = $state<Record<string, string>>({});
	let controller: AbortController | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let finishAnimation: (() => void) | undefined;
	let destroyed = false;

	onDestroy(() => {
		destroyed = true;
		controller?.abort();
		clearTimeout(timer);
		finishAnimation?.();
	});

	function displayDate(day: string): string {
		return data.language === 'fr' ? day.split('-').reverse().join('/') : day;
	}

	function selectPeriod(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		const selection = summaryDays(start, end, data.latestDay);
		if (!selection) {
			error = text.dailySummariesInvalidPeriod;
			return;
		}
		days = selection;
		selected = true;
		error = '';
		status = '';
		rowErrors = {};
	}

	async function recalculate(day: string): Promise<void> {
		currentDay = day;
		successfulDay = null;
		delete rowErrors[day];
		status = `${text.dailySummariesWorking} ${displayDate(day)}`;
		const body = new FormData();
		body.set('day', day);
		let failureMessage = text.dailySummariesWriteFailed;
		try {
			const response = await fetch(resolve('/private/configuration/daily-summaries') + '?/recalculate', {
				method: 'POST',
				body,
				headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
				signal: controller?.signal
			});
			const result = deserialize<{ day: string }, { error: string }>(await response.text());
			if (result.type === 'failure' && typeof result.data?.error === 'string') {
				failureMessage = result.data.error;
			}
			if (!response.ok || result.type !== 'success' || result.data?.day !== day) {
				throw new Error(failureMessage);
			}
			if (destroyed) return;
			successfulDay = day;
			status = `${text.dailySummariesSuccess} ${displayDate(day)}`;
			await new Promise<void>((resolve) => {
				finishAnimation = resolve;
				timer = setTimeout(resolve, 800);
			});
			finishAnimation = undefined;
			if (destroyed) return;
			days = days.filter((value) => value !== day);
			successfulDay = null;
		} catch {
			if (destroyed) return;
			rowErrors[day] = failureMessage;
			status = '';
		} finally {
			currentDay = null;
		}
	}

	async function run(day?: string) {
		if (busy || !days.length) return;
		busy = true;
		error = '';
		controller = new AbortController();
		try {
			for (const value of day ? [day] : [...days]) {
				if (destroyed) break;
				await recalculate(value);
			}
		} finally {
			busy = false;
			controller = undefined;
		}
	}
</script>

<svelte:head>
	<title>{text.dailySummariesTitle} — OkoVision</title>
	<meta name="description" content={text.dailySummariesDescription} />
</svelte:head>

<main id="contenu" class="container reports-page daily-summaries-page">
	<h2>{text.dailySummariesTitle}</h2>
	<p class="reports-description">{text.dailySummariesDescription}</p>
	<p class="reports-description">{text.dailySummariesHelp}</p>

	{#if data.loadError}
		<p class="reports-alert" role="alert">{text.dailySummariesLoadFailed}</p>
	{/if}
	{#if error}
		<p class="reports-alert" role="alert">{error}</p>
	{/if}
	<noscript><p class="reports-alert">{text.dailySummariesNeedsJavascript}</p></noscript>

	<form class="summary-period" onsubmit={selectPeriod}>
		<div>
			<label for="summary-start">{text.dailySummariesStart}</label>
			<input id="summary-start" type="date" bind:value={start} max={data.latestDay} required disabled={busy || data.loadError} />
		</div>
		<div>
			<label for="summary-end">{text.dailySummariesEnd}</label>
			<input id="summary-end" type="date" bind:value={end} min={start || undefined} max={data.latestDay} required disabled={busy || data.loadError} />
		</div>
		<button type="submit" class="reports-button" disabled={busy || data.loadError}>{text.dailySummariesShow}</button>
	</form>

	<div class="summary-toolbar">
		<p role="status" aria-live="polite">{status}</p>
		<button type="button" class="reports-button reports-button-primary" onclick={() => run()} disabled={busy || !days.length || data.loadError}>
			{text.dailySummariesAll}
		</button>
	</div>

	<div class="reports-table-scroll">
		<table class="reports-table seasons-table summary-table" aria-label={text.dailySummariesTitle} aria-busy={busy}>
			<thead>
				<tr>
					<th scope="col">{text.maintenanceEventsDate}</th>
					<th scope="col">{text.dailySummariesStatus}</th>
					<th scope="col"><span class="visually-hidden">{text.dailySummariesRecalculate}</span></th>
				</tr>
			</thead>
			<tbody>
				{#each days as day (day)}
					<tr class:summary-success={successfulDay === day} class:summary-failure={!!rowErrors[day]}>
						<td>{displayDate(day)}</td>
						<td>
							{#if successfulDay === day}
								{text.dailySummariesSuccess}
							{:else if currentDay === day}
								{text.dailySummariesWorking}
							{:else if rowErrors[day]}
								<span class="summary-error" role="alert">{rowErrors[day]}</span>
							{:else}
								{text.dailySummariesPending}
							{/if}
						</td>
						<td class="reports-actions">
							<button
								type="button"
								class="reports-action-button"
								aria-label="{text.dailySummariesRecalculate} : {displayDate(day)}"
								title="{text.dailySummariesRecalculate} : {displayDate(day)}"
								onclick={() => run(day)}
								disabled={busy || data.loadError}
							>
								<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
									<path d="M16 7a6.5 6.5 0 1 0 .3 5M16 3v4h-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</button>
						</td>
					</tr>
				{/each}
				{#if !days.length}
					<tr><td class="seasons-empty-cell" colspan="3">{selected ? text.dailySummariesDone : text.dailySummariesChoose}</td></tr>
				{/if}
			</tbody>
		</table>
	</div>
</main>
