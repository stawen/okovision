<script lang="ts">
	import { uiMessages } from '#lib/ui/i18n.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let visibleSensors = $derived(data.sensors.filter((sensor) => sensor.position !== -1));
</script>

<svelte:head>
	<title>{text.csvMappingTitle} — OkoVision</title>
	<meta name="description" content={text.csvMappingDescription} />
</svelte:head>

<main id="contenu" class="container reports-page">
	<h2>{text.csvMappingTitle}</h2>
	<p class="reports-description">{text.csvMappingDescription}</p>
	{#if data.loadError}
		<p class="reports-alert" role="alert">{text.csvMappingLoadFailed}</p>
	{:else}
		{#if form?.error}
			<p class="reports-alert" role="alert">{form.error}</p>
		{:else if form?.success}
			<p role="status">{text.csvMappingSuccess}</p>
		{/if}
		<p>{data.sensors.length ? text.csvMappingUpdateInfo : text.csvMappingEmpty}</p>
		<form method="POST">
			<input type="hidden" name="mode" value={data.sensors.length ? 'update' : 'create'} />
			<button class="reports-button reports-button-primary" type="submit">
				{data.sensors.length ? text.csvMappingUpdate : text.csvMappingCreate}
			</button>
		</form>
		{#if data.sensors.length}
			<div class="reports-table-scroll">
				<table class="reports-table">
					<thead>
						<tr>
							<th scope="col">{text.csvMappingOriginal}</th>
							<th scope="col">{text.csvMappingName}</th>
							<th scope="col">{text.csvMappingRealtime}</th>
							<th scope="col">{text.csvMappingType}</th>
						</tr>
					</thead>
					<tbody>
						{#each visibleSensors as sensor (sensor.id)}
							<tr>
								<td>{sensor.originalName}</td>
								<td>{sensor.name}</td>
								<td>{sensor.boiler || '—'}</td>
								<td>{sensor.type || '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</main>
