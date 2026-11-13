<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { tick } from 'svelte';
	import { uiMessages } from '#lib/ui/i18n.js';
	import type { PageProps } from './$types';

	type SeasonPageData = Extract<NonNullable<PageProps['form']>, { seasons: unknown }>;

	let { data, form }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let viewData = $derived(isSeasonsData(form) ? form : data);
	let formError = $derived(form && 'error' in form ? form.error : null);
	let seasonDialog: HTMLDialogElement | undefined = $state();
	let deleteSeasonDialog: HTMLDialogElement | undefined = $state();
	let startDateInput: HTMLInputElement | undefined = $state();
	let startDate = $state('');
	let editingSeason: { id: number; name: string; startDate: string } | null = $state(null);
	let seasonToDelete: { id: number; name: string } | null = $state(null);

	const closeSeasonDialogOnSuccess: SubmitFunction = () =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') seasonDialog?.close();
		};
	const closeDeleteDialogOnSuccess: SubmitFunction = () =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') deleteSeasonDialog?.close();
		};

	async function openSeasonDialog(season?: { id: number; name: string; startDate: string }) {
		editingSeason = season ?? null;
		startDate = season?.startDate ?? '';
		seasonDialog?.showModal();
		await tick();
		startDateInput?.focus();
	}

	function openDeleteDialog(season: { id: number; name: string }) {
		seasonToDelete = season;
		deleteSeasonDialog?.showModal();
	}

	function displayDate(date: string): string {
		return date.split('-').reverse().join('/');
	}

	function isSeasonsData(value: PageProps['form']): value is SeasonPageData {
		return value !== null && value !== undefined && 'seasons' in value;
	}
</script>

<svelte:head>
	<title>{text.seasonsTitle} — OkoVision</title>
	<meta name="description" content={text.seasonsDescription} />
</svelte:head>

<main id="contenu" class="container reports-page seasons-page">
	<h2>{text.seasonsTitle}</h2>
	<p class="reports-description">{text.seasonsDescription}</p>

	{#if formError}
		<p class="reports-alert" role="alert">{formError}</p>
	{/if}
	{#if viewData.databaseError}
		<p class="reports-alert" role="alert">{text.seasonsLoadFailed}</p>
	{/if}

	<div class="seasons-add">
		<button
			class="reports-button reports-button-primary"
			type="button"
			onclick={() => openSeasonDialog()}
			disabled={viewData.databaseError}
		>
			<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
				<path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			</svg>
			{text.seasonsAdd}
		</button>
	</div>

	{#if !viewData.databaseError}
		<div class="reports-table-scroll">
			<table class="reports-table seasons-table">
				<thead>
					<tr>
						<th scope="col">{text.seasonsColumn}</th>
						<th scope="col">{text.seasonsStartDate}</th>
						<th scope="col">{text.seasonsEndDate}</th>
						<th scope="col">
							<span class="visually-hidden">{text.dailyReportsEditGraph} / {text.dailyReportsDelete}</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each viewData.seasons as season (season.id)}
						<tr>
							<td>{season.name}</td>
							<td>{displayDate(season.startDate)}</td>
							<td>{displayDate(season.endDate)}</td>
							<td class="reports-actions">
								<div class="reports-row-actions">
									<button
										class="reports-action-button"
										type="button"
										aria-label="{text.dailyReportsEditGraph}: {season.name}"
										title="{text.dailyReportsEditGraph}: {season.name}"
										onclick={() => openSeasonDialog(season)}
										disabled={viewData.databaseError}
									>
										<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
											<path
												d="m12.8 4.2 3 3M3.5 16.5l3.2-.7L16.3 6.2a1.8 1.8 0 0 0-2.5-2.5L4.2 13.3l-.7 3.2Z"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</button>
									<button
										class="reports-action-button reports-action-button-danger"
										type="button"
										aria-label="{text.dailyReportsDelete}: {season.name}"
										title="{text.dailyReportsDelete}: {season.name}"
										onclick={() => openDeleteDialog(season)}
										disabled={viewData.databaseError}
									>
										<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
											<path
												d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.6 10H6.1L5.5 6m3 2.2v5.5m3-5.5v5.5"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</button>
								</div>
							</td>
						</tr>
					{/each}
					{#if !viewData.seasons.length}
						<tr>
							<td class="seasons-empty-cell" colspan="4">{text.seasonsEmpty}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}

	<dialog bind:this={seasonDialog} class="reports-dialog" aria-labelledby="season-dialog-title">
		<form
			method="POST"
			use:enhance={closeSeasonDialogOnSuccess}
			class="reports-dialog-form"
		>
			<input
				type="hidden"
				name="operation"
				value={editingSeason ? 'update-season' : 'create-season'}
			/>
			{#if editingSeason}
				<input type="hidden" name="seasonId" value={editingSeason.id} />
			{/if}
			<div class="reports-dialog-heading">
				<h2 id="season-dialog-title">
					{editingSeason ? text.seasonsEditTitle : text.seasonsCreateTitle}
				</h2>
				<button
					class="reports-dialog-close"
					type="button"
					aria-label={text.dailyReportsCancel}
					onclick={() => seasonDialog?.close()}>×</button
				>
			</div>
			<label for="season-start-date">{text.seasonsStartDate}</label>
			<input
				id="season-start-date"
				bind:this={startDateInput}
				bind:value={startDate}
				name="startDate"
				type="date"
				required
				disabled={viewData.databaseError}
			/>
			<div class="reports-dialog-actions">
				<button class="reports-button" type="button" onclick={() => seasonDialog?.close()}>
					{text.dailyReportsCancel}
				</button>
				<button
					class="reports-button reports-button-primary"
					type="submit"
					disabled={viewData.databaseError}
				>
					{editingSeason ? text.dailyReportsRename : text.seasonsAdd}
				</button>
			</div>
		</form>
	</dialog>

	<dialog
		bind:this={deleteSeasonDialog}
		class="reports-dialog"
		aria-labelledby="delete-season-dialog-title"
		aria-describedby="delete-season-name"
	>
		<form method="POST" use:enhance={closeDeleteDialogOnSuccess} class="reports-dialog-form">
			<input type="hidden" name="operation" value="delete-season" />
			<input type="hidden" name="seasonId" value={seasonToDelete?.id ?? ''} />
			<div class="reports-dialog-heading">
				<h2 id="delete-season-dialog-title">{text.seasonsConfirmDelete}</h2>
				<button
					class="reports-dialog-close"
					type="button"
					aria-label={text.dailyReportsCancel}
					onclick={() => deleteSeasonDialog?.close()}>×</button
				>
			</div>
			<p id="delete-season-name" class="reports-dialog-target">{seasonToDelete?.name ?? ''}</p>
			<div class="reports-dialog-actions">
				<button class="reports-button" type="button" onclick={() => deleteSeasonDialog?.close()}>
					{text.dailyReportsCancel}
				</button>
				<button
					class="reports-button reports-button-danger"
					type="submit"
					disabled={viewData.databaseError || !seasonToDelete}
				>
					{text.dailyReportsDelete}
				</button>
			</div>
		</form>
	</dialog>
</main>
