<script lang="ts">
	import { testBoilerConnection } from '#lib/boiler-address.js';
	import { configurationSections, setupMessages, timezoneOptions } from '#lib/ui/setup.js';
	import { uiMessages } from '#lib/ui/i18n.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const text = $derived(setupMessages(data.language));
	const ui = $derived(uiMessages(data.language));
	const values = $derived(form?.values ?? data.values);
	const timezones = $derived(timezoneOptions(values.timezone ?? ''));
	let loadingMode = $derived(values.hasSilo || '0');
	let address = $derived(values.chaudiere ?? '');
	let testing = $state(false);
	let testResult = $state<Awaited<ReturnType<typeof testBoilerConnection>> | null>(null);
	let testedAddress = $state('');
	let addressRevision = 0;

	async function testAddress() {
		const revision = addressRevision;
		const currentAddress = address;
		testing = true;
		testResult = null;
		const result = await testBoilerConnection(currentAddress);
		if (revision === addressRevision && address === currentAddress) {
			testedAddress = currentAddress;
			testResult = result;
		}
		testing = false;
	}

	function addressChanged() {
		addressRevision++;
		testResult = null;
	}
</script>

<svelte:head><title>{ui.settingsTitle} — OkoVision</title></svelte:head>

<main id="contenu" class="container settings-page" aria-labelledby="settings-title">
	<h1 id="settings-title">{ui.settingsTitle}</h1>
	{#if form?.success}<p class="success" role="status">{text.settingsSaved}</p>{/if}
	{#if form?.message}<p class="warning" role="alert">{form.message}</p>{/if}
	<form method="POST">
		{#each configurationSections as section (section.key)}
			<fieldset class="configuration-section">
				<legend>{text.sections[section.key]}</legend>
				{#each section.parameters as param (param)}
					<div class="field" hidden={param === 'siloSize' && loadingMode !== '1'}>
						<label for={param}>{text.fields[param]}</label>
						{#if param === 'hasSilo'}
							<select id={param} name={param} bind:value={loadingMode} aria-describedby={`${param}-help`}>
								<option value="0">{text.loadingModes.bags}</option><option value="1">{text.loadingModes.silo}</option>
							</select>
							<noscript><small>{text.loadingModeNeedsJavascript}</small></noscript>
						{:else if param === 'timezone'}
							<select id={param} name={param} value={values[param] || 'Europe/Paris'} aria-describedby={`${param}-help`} required>
								{#each timezones as timezone (timezone)}
									<option value={timezone}>{timezone}</option>
								{/each}
							</select>
						{:else if param === 'chaudiere'}
							<div class="boiler-address">
								<input id={param} name={param} bind:value={address} oninput={addressChanged}
									placeholder={text.examples[param]} aria-describedby={`${param}-format ${param}-help`} required maxlength="255" />
								<button class="test-button" type="button" onclick={testAddress} disabled={testing}>
									{testing ? text.testingBoiler : text.testBoiler}
								</button>
							</div>
						{:else}
							<input id={param} name={param} value={values[param] || ''}
								placeholder={text.examples[param]}
								aria-describedby={param === 'siloSize' ? `${param}-requirement ${param}-help` : `${param}-help`}
								required={['tcRef', 'poidsPellet', 'surfaceMaison'].includes(param) || (param === 'siloSize' && loadingMode === '1')}
								maxlength="255" />
						{/if}
						{#if param === 'siloSize'}
							<small id={`${param}-requirement`}>{text.siloRequired}</small>
						{:else if param === 'chaudiere'}
							<small id={`${param}-format`}>{text.boilerFormat}</small>
						{/if}
						{#if param === 'chaudiere'}
							<div class="test-result" aria-live="polite">
								{#if testedAddress === address && testResult?.status === 'reachable'}
									<p>{text.boilerResponded}</p>
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
									<a href={testResult.url} target="_blank" rel="noopener noreferrer">{text.boilerFiles}</a>
								{:else if testedAddress === address && testResult?.status === 'invalid'}
									<p class="test-error">{text.boilerInvalid}</p>
								{:else if testedAddress === address && testResult?.status === 'unreachable'}
									<p class="test-error">{text.boilerUnreachable}</p>
								{/if}
							</div>
							<noscript><small>{text.boilerNeedsJavascript}</small></noscript>
						{/if}
					</div>
				{/each}
				<details class="configuration-help">
					<summary>{text.moreInformation}<span class="visually-hidden"> — {text.sections[section.key]}</span></summary>
					<dl>
						{#each section.parameters as param (param)}
							<div><dt>{text.fields[param]}</dt><dd id={`${param}-help`}>{text.help[param]}</dd></div>
						{/each}
					</dl>
				</details>
			</fieldset>
		{/each}
		<button class="wide" type="submit">{text.saveConfig}</button>
	</form>
</main>

<style>
	.settings-page { max-width: 60rem; padding-block: 2rem; }
	.settings-page h1 { margin-bottom: 1rem; }
	.settings-page > p { margin-block: 1rem; }
	form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
	label { display: grid; gap: 0.35rem; font-size: 0.9rem; }
	.field { display: grid; align-content: start; gap: 0.35rem; min-width: 0; }
	.boiler-address { display: flex; gap: 0.5rem; }
	.boiler-address input { flex: 1; }
	.boiler-address .test-button { width: auto; flex: 0 0 auto; }
	.test-result { font-size: 0.8rem; }
	.test-error { color: #8e3535; }
	input, select, button { min-width: 0; width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 5px; font: inherit; }
	button { background: var(--primary-dark); color: white; cursor: pointer; }
	.wide { grid-column: 1 / -1; }
	.warning, .success { padding: 1rem; border: 1px solid var(--border); border-radius: 5px; }
	.warning { border-color: var(--warning); background: #fff8eb; }
	.success { border-color: #cfe7d7; background: #f3faf5; color: #315d3b; }
	@media (max-width: 640px) { form { grid-template-columns: minmax(0, 1fr); } }
</style>
