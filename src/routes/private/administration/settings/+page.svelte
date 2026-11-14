<script lang="ts">
	import { configurationParameters } from '#lib/configuration.js';
	import { setupMessages } from '#lib/ui/setup.js';
	import { uiMessages } from '#lib/ui/i18n.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const text = $derived(setupMessages(data.language));
	const ui = $derived(uiMessages(data.language));
	const values = $derived(form?.values ?? data.values);
</script>

<svelte:head><title>{ui.settingsTitle} — OkoVision</title></svelte:head>

<main id="contenu" class="container settings-page" aria-labelledby="settings-title">
	<h1 id="settings-title">{ui.settingsTitle}</h1>
	<p>{ui.settingsDescription}</p>
	{#if form?.success}<p class="success" role="status">{text.settingsSaved}</p>{/if}
	{#if form?.message}<p class="warning" role="alert">{form.message}</p>{/if}
	<form method="POST">
		{#each configurationParameters as param (param)}
			<label>{text.fields[param]}
				{#if param === 'hasSilo'}
					<select name={param} value={values[param] || '0'}>
						<option value="0">{text.no}</option><option value="1">{text.yes}</option>
					</select>
				{:else}
					<input name={param} value={values[param] || (param === 'timezone' ? 'Europe/Paris' : '')}
						placeholder={text.examples[param]}
						required={['chaudiere', 'tcRef', 'poidsPellet', 'surfaceMaison', 'timezone'].includes(param)}
						maxlength="255" />
				{/if}
			</label>
		{/each}
		<button class="wide" type="submit">{text.saveConfig}</button>
	</form>
</main>

<style>
	.settings-page { max-width: 60rem; padding-block: 2rem; }
	.settings-page > p { margin-block: 1rem; }
	form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
	label { display: grid; gap: 0.35rem; font-size: 0.9rem; }
	input, select, button { min-width: 0; width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 5px; font: inherit; }
	button { background: var(--primary-dark); color: white; cursor: pointer; }
	.wide { grid-column: 1 / -1; }
	.warning, .success { padding: 1rem; border: 1px solid var(--border); border-radius: 5px; }
	.warning { border-color: var(--warning); background: #fff8eb; }
	.success { background: var(--surface); }
	@media (max-width: 640px) { form { grid-template-columns: minmax(0, 1fr); } }
</style>
