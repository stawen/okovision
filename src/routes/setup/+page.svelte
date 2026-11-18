<script lang="ts">
	import { testBoilerConnection } from '#lib/boiler-address.js';
	import { configurationSections, setupMessages, timezoneOptions } from '#lib/ui/setup.js';
	import { energyConfigurationDefaults } from '#lib/configuration.js';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const text = $derived(setupMessages(data.language));
	const installing = $derived(data.status === 'install' || data.status === 'partial');
	const values = $derived(form?.values ?? data.values);
	const timezones = $derived(timezoneOptions(values.timezone ?? ''));
	let loadingMode = $derived(values.hasSilo || '1');
	const matrixPending = $derived(data.status === 'matrix' || form?.matrixPending === true);
	let address = $derived(values.chaudiere ?? '');
	let testing = $state(false);
	let testResult = $state<Awaited<ReturnType<typeof testBoilerConnection>> | null>(null);
	let testedAddress = $state('');
	let addressRevision = 0;
	const matrixCanInitialize = $derived(testResult?.status === 'reachable' && testedAddress === address);

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

<svelte:head><title>{text.title} — OkoVision</title></svelte:head>

<main id="contenu" class="container setup-page" aria-labelledby="setup-title">
	<h1 id="setup-title">{text.title}</h1>
	<p class:warning={data.status === 'partial' || matrixPending}>
		{matrixPending ? text.matrixPending : text[data.status === 'partial' ? 'partial' : installing ? 'install' : 'configure']}
	</p>
	{#if form?.message}
		<p class:warning={!form.matrixPending} role={form.matrixPending ? 'status' : 'alert'}>{form.message}</p>
	{/if}
	{#if form?.matrixPending}
		<p>{text.matrixLoginRequired}</p>
		<a href={resolve('/login')}>{text.matrixLogin}</a>
	{:else if data.status === 'matrix'}
		<p>{text.matrixImpact}</p>
		{#if data.admin}
			<form method="POST" action="?/retryMatrix">
				<button class="wide" type="submit">{text.matrixRetry}</button>
			</form>
		{:else}
			<p>{text.matrixLoginRequired}</p>
			<a href={resolve('/login')}>{text.matrixLogin}</a>
		{/if}
	{:else}
		<form method="POST" action="?/save">
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
										placeholder={`${text.examplePrefix} ${text.examples[param]}`} aria-describedby={`${param}-format ${param}-help`} required maxlength="255" />
									<button class="test-button" type="button" onclick={testAddress} disabled={testing}>
										{testing ? text.testingBoiler : text.testBoiler}
									</button>
								</div>
							{:else}
								<input id={param} name={param} value={values[param] ?? (param === 'pciPellet' || param === 'rendementChaudiere' ? energyConfigurationDefaults[param] : '')}
									placeholder={`${text.examplePrefix} ${text.examples[param]}`}
									aria-describedby={param === 'siloSize' ? `${param}-requirement ${param}-help` : `${param}-help`}
									required={['tcRef', 'poidsPellet', 'surfaceMaison', 'pciPellet', 'rendementChaudiere'].includes(param) || (param === 'siloSize' && loadingMode === '1')}
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
								<div class="matrix-status" class:matrix-status-ready={matrixCanInitialize} role="status" aria-live="polite">
									{matrixCanInitialize ? text.matrixTestReady : text.boilerTestRequired}
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
			<input type="hidden" name="initializeMatrix" value={matrixCanInitialize ? 'yes' : 'no'} />
			{#if installing}
				<label>{text.password}<input type="password" name="adminPassword" placeholder={text.passwordPlaceholder} autocomplete="new-password" minlength="12" maxlength="1024" required /></label>
				<label>{text.confirm}<input type="password" name="confirmPassword" placeholder={text.confirmPlaceholder} autocomplete="new-password" minlength="12" maxlength="1024" required /></label>
			{/if}
			{#if data.status === 'partial'}
				<label class="wide confirmation"><input type="checkbox" name="force" value="yes" required /> {text.force}</label>
				<label class="wide">{text.forceWord}<input name="forceConfirmation" placeholder={text.forceWordPlaceholder} autocomplete="off" required pattern="INSTALLER" /></label>
			{/if}
			<button class="wide" type="submit" disabled={testing || !matrixCanInitialize}>
				{installing ? text.save : text.saveConfig}
			</button>
		</form>
	{/if}
</main>

<style>
	.setup-page { max-width: 60rem; padding-block: 2rem; }
	.setup-page > p { margin-block: 1rem; }
	form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
	label { display: grid; gap: 0.35rem; font-size: 0.9rem; }
	.field { display: grid; align-content: start; gap: 0.35rem; min-width: 0; }
	.field input::placeholder { color: rgb(37 50 71 / 70%); opacity: 1; }
	.boiler-address { display: flex; gap: 0.5rem; }
	.boiler-address input { flex: 1; }
	.boiler-address .test-button { width: auto; flex: 0 0 auto; }
	.test-result { font-size: 0.8rem; }
	.test-error { color: #8e3535; }
	.matrix-status { grid-column: 1 / -1; padding: 0.75rem; border: 1px solid var(--warning); border-radius: 5px; background: #fff8eb; color: #714d12; font-size: 0.9rem; }
	.matrix-status-ready { border-color: #45a85a; background: #edf8ef; color: #245b2e; }
	input, select, button { min-width: 0; width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 5px; font: inherit; }
	button { background: var(--primary-dark); color: white; cursor: pointer; }
	button:disabled { border-color: #d3dae2; background: #e4e9ef; color: #778393; cursor: not-allowed; }
	.wide { grid-column: 1 / -1; }
	.warning { padding: 1rem; border: 1px solid var(--warning); border-radius: 5px; background: #fff8eb; }
	.confirmation { display: flex; align-items: flex-start; }
	.confirmation input { width: auto; margin-top: 0.4rem; }
	.setup-page > a { display: inline-block; margin-block: 0.5rem; }
	@media (max-width: 640px) { form { grid-template-columns: minmax(0, 1fr); } }
</style>
