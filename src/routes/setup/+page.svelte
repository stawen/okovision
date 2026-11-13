<script lang="ts">
	import { configurationParameters } from '#lib/configuration.js';
	import { setupMessages } from '#lib/ui/setup.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const text = $derived(setupMessages(data.language));
	const installing = $derived(data.status === 'install' || data.status === 'partial');
	const values = $derived(form?.values ?? data.values);
</script>

<svelte:head><title>{text.title} — OkoVision</title></svelte:head>

<main id="contenu" class="container setup-page" aria-labelledby="setup-title">
	<h1 id="setup-title">{text.title}</h1>
	<p class:warning={data.status === 'partial'}>{text[data.status === 'partial' ? 'partial' : installing ? 'install' : 'configure']}</p>
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
		{#if installing}
			<label>{text.password}<input type="password" name="adminPassword" placeholder={text.passwordPlaceholder} autocomplete="new-password" minlength="12" maxlength="1024" required /></label>
			<label>{text.confirm}<input type="password" name="confirmPassword" placeholder={text.confirmPlaceholder} autocomplete="new-password" minlength="12" maxlength="1024" required /></label>
		{/if}
		{#if data.status === 'partial'}
			<label class="wide confirmation"><input type="checkbox" name="force" value="yes" required /> {text.force}</label>
			<label class="wide">{text.forceWord}<input name="forceConfirmation" placeholder={text.forceWordPlaceholder} autocomplete="off" required pattern="INSTALLER" /></label>
		{/if}
		<button class="wide" type="submit">{installing ? text.save : text.saveConfig}</button>
	</form>
</main>

<style>
	.setup-page { max-width: 60rem; padding-block: 2rem; }
	.setup-page > p { margin-block: 1rem; }
	form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
	label { display: grid; gap: 0.35rem; font-size: 0.9rem; }
	input, select, button { min-width: 0; width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 5px; font: inherit; }
	button { background: var(--primary-dark); color: white; cursor: pointer; }
	.wide { grid-column: 1 / -1; }
	.warning { padding: 1rem; border: 1px solid var(--warning); border-radius: 5px; background: #fff8eb; }
	.confirmation { display: flex; align-items: flex-start; }
	.confirmation input { width: auto; margin-top: 0.4rem; }
	@media (max-width: 640px) { form { grid-template-columns: minmax(0, 1fr); } }
</style>
