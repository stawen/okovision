<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { getContext, onMount } from 'svelte';
	import { navigationPages } from '#lib/ui/navigation.js';
	import { numberLocale, uiMessages } from '#lib/ui/i18n.js';
	import { boilerConfigurationText } from '#lib/ui/boiler-configurations.js';
	import { BoilerDraft, boilerDraftContext } from '#lib/boiler-draft.svelte.js';
	import { parseBoilerConfiguration } from '#lib/boiler-configurations.js';
	import { configurationRequest, ConfigurationRequestError } from '#lib/boiler-configuration-api.js';
	import { editableRealtimeIndicators, legacySensorId, realtimeSections } from '#lib/indicators/realtime.js';
	import type { BoilerConfiguration } from '#lib/boiler-configurations.js';
	import type { SavedBoilerConfiguration } from '#lib/server/repositories/boiler-configurations.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const draft = getContext<BoilerDraft | undefined>(boilerDraftContext) ?? new BoilerDraft();
	let text = $derived(uiMessages(data.language));
	let labels = $derived(boilerConfigurationText(data.language));
	let tabs = $derived(navigationPages(data.language).filter((page) => page.group === 'realtime'));
	let updatedConfigurations = $state<SavedBoilerConfiguration[] | null>(null);
	let configurations = $derived(updatedConfigurations ?? data.configurations);
	let description = $state('');
	let busy = $state(false);
	let message = $state('');
	let failure = $state(false);
	let confirmDelete: HTMLDialogElement | undefined = $state();
	let confirmLoad: HTMLDialogElement | undefined = $state();
	let deleting = $state<SavedBoilerConfiguration | null>(null);
	let loadingConfiguration = $state<SavedBoilerConfiguration | null>(null);
	let viewing = $state<BoilerConfiguration | null>(null);
	let viewTitle = $state('');
	let viewDate = $state('');
	let viewDialog: HTMLDialogElement | undefined = $state();
	let previewSections = $derived(realtimeSections.map((section) => ({
		titleKey: section.titleKey,
		indicators: section.indicators.filter((indicator) =>
			editableRealtimeIndicators.includes(indicator) && viewing?.[legacySensorId(indicator)] !== undefined)
	})).filter((section) => section.indicators.length > 0));

	onMount(() => {
		draft.initialize(data.indicators);
	});

	function formatDate(timestamp: number): string {
		return new Intl.DateTimeFormat(numberLocale(data.language), {
			timeZone: 'UTC', dateStyle: 'short', timeStyle: 'medium'
		}).format(new Date(timestamp * 1000));
	}

	function showError(cause: unknown, operation: string): void {
		failure = true;
		const code = cause instanceof ConfigurationRequestError ? cause.code : '';
		message = code === 'uncertain' ? labels.uncertain
			: code === 'conflict' ? (operation === 'save' ? labels.duplicate : labels.conflict)
				: code === 'invalid' ? labels.invalid : labels.error;
	}

	async function save() {
		if (busy || draft.uncertain || !draft.dirty) return;
		busy = true;
		draft.busy = true;
		message = '';
		const previous = draft.changes;
		try {
			const result = await configurationRequest({ operation: 'save', description, config: draft.values, previous });
			if (typeof result.timestamp !== 'number' || !Number.isSafeInteger(result.timestamp)
				|| result.timestamp <= 0 || result.applied !== true) throw new Error('Invalid save response');
			updatedConfigurations = [{ timestamp: result.timestamp, description: description.trim() }, ...configurations]
				.sort((a, b) => b.timestamp - a.timestamp);
			draft.applied();
			message = labels.applied;
			failure = false;
			description = '';
		} catch (cause) {
			if (cause instanceof ConfigurationRequestError && cause.savedTimestamp !== null) {
				updatedConfigurations = [{ timestamp: cause.savedTimestamp, description: description.trim() }, ...configurations]
					.sort((a, b) => b.timestamp - a.timestamp);
				description = '';
				showError(cause, 'apply');
				message = `${labels.savedApplyFailed} ${['invalid', 'conflict'].includes(cause.code) ? message : labels.uncertain}`;
			} else if (cause instanceof ConfigurationRequestError && ['invalid', 'conflict'].includes(cause.code)) {
				showError(cause, 'save');
			} else {
				failure = true;
				message = labels.saveUncertain;
			}
			if (!(cause instanceof ConfigurationRequestError) || !['invalid', 'conflict'].includes(cause.code)) {
				draft.uncertain = true;
			}
		} finally {
			busy = false;
			draft.busy = false;
		}
	}

	async function loadConfiguration(timestamp: number) {
		busy = true;
		draft.busy = true;
		message = '';
		try {
			const result = await configurationRequest({ operation: 'get', timestamp });
			draft.load(parseBoilerConfiguration(result.config));
			message = labels.loaded;
			failure = false;
			draft.busy = false;
			await goto(resolve('/private/realtime/settings'));
		} catch (cause) {
			showError(cause, 'get');
		} finally {
			busy = false;
			draft.busy = false;
		}
	}

	function requestLoad(configuration: SavedBoilerConfiguration) {
		if (!draft.dirty) {
			void loadConfiguration(configuration.timestamp);
			return;
		}
		loadingConfiguration = configuration;
		confirmLoad?.showModal();
	}

	async function viewConfiguration(configuration: SavedBoilerConfiguration) {
		busy = true;
		draft.busy = true;
		try {
			const result = await configurationRequest({ operation: 'get', timestamp: configuration.timestamp });
			viewing = parseBoilerConfiguration(result.config);
			viewTitle = configuration.description;
			viewDate = formatDate(configuration.timestamp);
			viewDialog?.showModal();
		} catch (cause) {
			showError(cause, 'get');
		} finally {
			busy = false;
			draft.busy = false;
		}
	}

	async function removeConfiguration() {
		if (!deleting) return;
		busy = true;
		draft.busy = true;
		try {
			const result = await configurationRequest({ operation: 'delete', timestamp: deleting.timestamp });
			if (result.deleted !== true) throw new Error('Invalid delete response');
			updatedConfigurations = configurations.filter((configuration) => configuration.timestamp !== deleting?.timestamp);
			confirmDelete?.close();
			message = '';
		} catch (cause) {
			showError(cause, 'delete');
		} finally {
			busy = false;
			draft.busy = false;
		}
	}

</script>

<svelte:head>
	<title>{text.realtimeConfigurationsTitle} — OkoVision</title>
	<meta name="description" content={text.realtimeConfigurationsDescription} />
</svelte:head>

<main id="contenu" class="container realtime-page reports-page">
	<nav class="page-tabs" aria-label={text.realtime}>
		{#each tabs as tab (tab.path)}
			<a href={resolve(tab.path)} aria-current={tab.path === '/private/realtime/configurations' ? 'page' : undefined}>
				{tab.title}
			</a>
		{/each}
	</nav>
	<p class="configuration-intro">{labels.intro}</p>
	{#if draft.dirty && !draft.uncertain}<p class="configuration-pending" role="status">{labels.pending}</p>{/if}
	{#if message}<p class:reports-alert={failure} role={failure ? 'alert' : 'status'}>{message}</p>{/if}
	{#if draft.uncertain && !message}<p class="reports-alert" role="alert">{labels.uncertain}</p>{/if}
	{#if data.databaseError}<p class="reports-alert" role="alert">{labels.databaseError}</p>{/if}
	{#if data.realtimeError}<p class="reports-alert" role="alert">{labels.offline}</p>{/if}
	{#if draft.initialized && !draft.complete}<p class="reports-alert" role="alert">{labels.incomplete}</p>{/if}

	{#if draft.dirty}
		<form class="configuration-save" onsubmit={(event) => { event.preventDefault(); void save(); }}>
			<label for="configuration-description">{labels.description}</label>
			<input id="configuration-description" bind:value={description} maxlength="50" required disabled={busy || draft.uncertain} />
			<button class="reports-button reports-button-primary" type="submit"
				disabled={busy || draft.uncertain || data.databaseError || !draft.complete}>{labels.save}</button>
			<p class="configuration-save-help">{labels.saveHelp}</p>
		</form>
	{/if}

	{#if !data.databaseError}
		<div class="reports-table-scroll">
			<table class="reports-table seasons-table configuration-table">
				<thead><tr><th scope="col">{text.maintenanceEventsDate}</th><th scope="col">{labels.description}</th><th scope="col"><span class="visually-hidden">{labels.view} / {labels.load} / {labels.delete}</span></th></tr></thead>
				<tbody>
					{#each configurations as configuration (configuration.timestamp)}
						<tr>
							<td>{formatDate(configuration.timestamp)}</td><td>{configuration.description}</td>
							<td class="reports-actions"><div class="reports-row-actions">
								<button class="reports-action-button" type="button" disabled={busy} title={labels.view}
									aria-label={`${labels.view} : ${configuration.description} — ${formatDate(configuration.timestamp)}`}
									onclick={() => viewConfiguration(configuration)}>
									<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
										<path d="M2 10s2.8-4.5 8-4.5 8 4.5 8 4.5-2.8 4.5-8 4.5S2 10 2 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
										<circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5" />
									</svg>
								</button>
								<button class="reports-action-button" type="button" disabled={busy || !draft.initialized} title={labels.load}
									aria-label={`${labels.load} : ${configuration.description} — ${formatDate(configuration.timestamp)}`}
									onclick={() => requestLoad(configuration)}>
									<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
										<path d="M3 5.5h5l1.5 1.8H17v8.2H3V5.5ZM10 9v5m-2-2 2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</button>
								<button class="reports-action-button reports-action-button-danger" type="button" disabled={busy} title={labels.delete}
									aria-label={`${labels.delete} : ${configuration.description} — ${formatDate(configuration.timestamp)}`}
									onclick={() => { deleting = configuration; confirmDelete?.showModal(); }}>
									<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
										<path d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.6 10H6.1L5.5 6m3 2.2v5.5m3-5.5v5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</button>
							</div></td>
						</tr>
					{:else}
						<tr><td class="seasons-empty-cell" colspan="3">{labels.empty}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
	<dialog bind:this={confirmLoad} class="reports-dialog configuration-confirm" aria-labelledby="confirm-load-title" aria-describedby="confirm-load-message">
		<header class="confirm-header">
			<h2 id="confirm-load-title">{labels.loadConfirmTitle}</h2>
			<button class="reports-dialog-close" type="button" aria-label={labels.close} onclick={() => confirmLoad?.close()}>×</button>
		</header>
		<div class="confirm-body">
			{#if loadingConfiguration}
				<p class="confirm-target"><strong>{loadingConfiguration.description}</strong><span>{formatDate(loadingConfiguration.timestamp)}</span></p>
			{/if}
			<p id="confirm-load-message">{labels.replaceConfirm}</p>
		</div>
		<footer class="confirm-actions">
			<button class="reports-button" type="button" onclick={() => confirmLoad?.close()}>{labels.cancel}</button>
			<button class="reports-button reports-button-primary" type="button" disabled={busy} onclick={() => {
				if (loadingConfiguration) {
					confirmLoad?.close();
					void loadConfiguration(loadingConfiguration.timestamp);
				}
			}}>{labels.load}</button>
		</footer>
	</dialog>
	<dialog bind:this={confirmDelete} class="reports-dialog configuration-confirm" aria-labelledby="confirm-delete-title">
		<header class="confirm-header">
			<h2 id="confirm-delete-title">{labels.deleteConfirmTitle}</h2>
			<button class="reports-dialog-close" type="button" aria-label={labels.close} onclick={() => confirmDelete?.close()}>×</button>
		</header>
		<div class="confirm-body">
			{#if deleting}
				<p class="confirm-target"><strong>{deleting.description}</strong><span>{formatDate(deleting.timestamp)}</span></p>
			{/if}
			<p>{labels.deleteConfirm}</p>
		</div>
		<footer class="confirm-actions">
			<button class="reports-button" type="button" onclick={() => confirmDelete?.close()}>{labels.cancel}</button>
			<button class="reports-button reports-button-danger" type="button" disabled={busy} onclick={removeConfiguration}>{labels.delete}</button>
		</footer>
	</dialog>
	<dialog bind:this={viewDialog} class="reports-dialog configuration-preview" aria-labelledby="configuration-preview-title" aria-describedby="configuration-preview-date">
		<header class="preview-header">
			<div class="preview-heading">
				<p class="preview-eyebrow">{labels.previewTitle}</p>
				<h2 id="configuration-preview-title">{viewTitle}</h2>
				<p id="configuration-preview-date" class="preview-date">{viewDate}</p>
			</div>
			<button class="reports-dialog-close" type="button" aria-label={labels.close} onclick={() => viewDialog?.close()}>×</button>
		</header>
		<div class="preview-content">
			{#each previewSections as section (section.titleKey)}
				<section class="preview-section">
					<h3>{text[section.titleKey]}</h3>
					<dl class="preview-readings">
						{#each section.indicators as indicator (indicator.id)}
							<div class="preview-reading">
								<dt>{text[indicator.labelKey]}</dt>
								<dd>{viewing?.[legacySensorId(indicator)]}</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/each}
		</div>
		<footer class="preview-footer">
			<button class="reports-button" type="button" onclick={() => viewDialog?.close()}>{labels.close}</button>
		</footer>
	</dialog>
</main>

<style>
	.configuration-intro { margin-bottom: 1rem; color: #536274; font-size: .88rem; line-height: 1.45; }
	.configuration-pending { padding: .65rem; border: 1px solid #d89c22; background: #fff5d6; color: #604000; }
	.configuration-save { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: .45rem; max-width: 40rem; margin-block: 1rem; }
	.configuration-save label { grid-column: 1 / -1; }
	.configuration-save input { min-width: 0; padding: .45rem; }
	.configuration-save-help { grid-column: 1 / -1; color: #52647a; font-size: .8rem; }
	@media (max-width: 520px) {
		.configuration-save input { grid-column: 1 / -1; }
		.configuration-save button { grid-column: 2; }
	}
	.configuration-table td:first-child { width: 1%; white-space: nowrap; }
	.configuration-confirm { width: min(25rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem); padding: 0; overflow-y: auto; }
	.confirm-header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .8rem 1rem; border-bottom: 1px solid #e4eaf1; }
	.confirm-header h2 { color: #253247; font-size: 1rem; line-height: 1.35; }
	.confirm-header button { flex-shrink: 0; }
	.confirm-body { display: grid; gap: .7rem; padding: .9rem 1rem; color: #52647a; font-size: .85rem; line-height: 1.45; }
	.confirm-target { display: grid; gap: .2rem; min-width: 0; padding: .65rem .75rem; border: 1px solid #e1e8ef; border-radius: 6px; background: #f8fafc; overflow-wrap: anywhere; }
	.confirm-target strong { color: #253e59; }
	.confirm-target span { color: #64758a; font-size: .78rem; }
	.confirm-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .55rem; padding: .7rem 1rem; border-top: 1px solid #e4eaf1; background: #fbfcfe; }
	.confirm-actions button { max-width: 100%; white-space: normal; }
	.configuration-preview { width: min(52rem, calc(100vw - 2rem)); max-height: min(46rem, calc(100dvh - 2rem)); padding: 0; overflow: hidden; }
	.configuration-preview[open] { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
	.preview-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.2rem 1.4rem; border-bottom: 1px solid #e4eaf1; }
	.preview-heading { min-width: 0; }
	.preview-eyebrow { color: #60748a; font-size: .73rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
	.preview-heading h2 { margin-top: .15rem; color: #253247; font-size: 1.2rem; line-height: 1.3; overflow-wrap: anywhere; }
	.preview-date { margin-top: .25rem; color: #64758a; font-size: .8rem; }
	.preview-content { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 1.2rem 1.4rem; }
	.preview-section + .preview-section { margin-top: 1.2rem; }
	.preview-section h3 { margin-bottom: .55rem; color: #42566d; font-size: .86rem; font-weight: 700; }
	.preview-readings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .45rem; margin: 0; }
	.preview-reading { display: flex; align-items: center; justify-content: space-between; gap: .75rem; min-width: 0; padding: .6rem .7rem; border: 1px solid #e1e8ef; border-radius: 6px; background: #f8fafc; }
	.preview-reading dt { min-width: 0; color: #52647a; font-size: .8rem; line-height: 1.35; overflow-wrap: anywhere; }
	.preview-reading dd { flex: 0 1 auto; max-width: 50%; margin: 0; color: #253e59; font-size: .85rem; font-weight: 700; text-align: right; overflow-wrap: anywhere; }
	.preview-footer { display: flex; justify-content: flex-end; padding: .8rem 1.4rem; border-top: 1px solid #e4eaf1; background: #fbfcfe; }
	@media (max-width: 600px) {
		.preview-header, .preview-content { padding-inline: 1rem; }
		.preview-readings { grid-template-columns: 1fr; }
		.preview-footer { padding-inline: 1rem; }
	}
</style>
