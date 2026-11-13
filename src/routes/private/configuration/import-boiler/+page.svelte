<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { uiMessages } from '#lib/i18n.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let processingFile = $state<string | null>(null);
	let feedback = $derived(form && 'error' in form ? form.error : null);
	let failed = $derived(Boolean(form && 'error' in form));

	const enhanceBoilerImport: SubmitFunction = ({ formData, cancel }) => {
		if (processingFile !== null) {
			cancel();
			return;
		}
		const file = formData.get('file');
		processingFile = typeof file === 'string' ? file : null;
		return async ({ result, update }) => {
			try {
				await update();
				if (result.type === 'success' && result.data && typeof result.data.successMessage === 'string') {
					toast.success(result.data.successMessage);
				}
			} finally {
				processingFile = null;
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
