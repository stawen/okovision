<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { tick } from 'svelte';
	import { uiMessages } from '#lib/i18n.js';
	import type { ManagedSiloEvent, SiloEventType } from '#lib/server/repositories/silo-events.js';
	import type { PageProps } from './$types';

	type EventsPageData = Extract<NonNullable<PageProps['form']>, { events: unknown }>;

	let { data, form }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let viewData = $derived(isEventsData(form) ? form : data);
	let formError = $derived(form && 'error' in form ? form.error : null);
	let eventDialog: HTMLDialogElement | undefined = $state();
	let deleteEventDialog: HTMLDialogElement | undefined = $state();
	let eventTypeSelect: HTMLSelectElement | undefined = $state();
	let eventType = $state<SiloEventType>('PELLET');
	let eventDate = $state(todayDate());
	let quantity = $state('');
	let remaining = $state('0');
	let price = $state('0');
	let editingEvent: ManagedSiloEvent | null = $state(null);
	let eventToDelete: ManagedSiloEvent | null = $state(null);

	let eventTypeLabels = $derived({
		PELLET: text.maintenanceEventPellets,
		ASHES: text.maintenanceEventAshes,
		MAINT: text.maintenanceEventMaintenance,
		SWEEP: text.maintenanceEventChimneySweeping,
		BAG: text.maintenanceEventBag
	} satisfies Record<SiloEventType, string>);
	const closeEventDialogOnSuccess: SubmitFunction = () =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') eventDialog?.close();
		};
	const closeDeleteDialogOnSuccess: SubmitFunction = () =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') deleteEventDialog?.close();
		};

	async function openEventDialog(event?: ManagedSiloEvent) {
		editingEvent = event ?? null;
		eventType = event?.eventType ?? 'PELLET';
		eventDate = event?.eventDate ?? todayDate();
		quantity = event ? String(event.quantity) : '';
		remaining = event ? String(event.remaining) : '0';
		price = event ? String(event.price) : '0';
		eventDialog?.showModal();
		await tick();
		eventTypeSelect?.focus();
	}

	function openDeleteDialog(event: ManagedSiloEvent) {
		eventToDelete = event;
		deleteEventDialog?.showModal();
	}

	function todayDate(): string {
		const now = new Date();
		return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
	}

	function displayDate(date: string): string {
		return date.split('-').reverse().join('/');
	}

	function formatNumber(value: number): string {
		return new Intl.NumberFormat(data.language === 'fr' ? 'fr-FR' : 'en-US').format(value);
	}

	function eventDetails(event: ManagedSiloEvent): string {
		switch (event.eventType) {
			case 'PELLET': {
				const pricePerTonne = event.quantity > 0
					? ` (${formatNumber(Math.round(1000 * event.price / event.quantity))} €/T)`
					: '';
				return `${formatNumber(event.quantity)} kg, ${formatNumber(event.price)} €${pricePerTonne}`;
			}
			case 'BAG': {
				const pricePerBag = event.quantity > 0
					? ` (${formatNumber(Math.round(15 * event.price / event.quantity))} €/15 kg)`
					: '';
				return `${formatNumber(event.quantity)} kg, ${formatNumber(event.price)} €${pricePerBag}`;
			}
			case 'MAINT':
			case 'SWEEP':
				return `${formatNumber(event.price)} €`;
			case 'ASHES':
				return text.maintenanceEventsNoDetails;
		}
	}

	function isEventsData(value: PageProps['form']): value is EventsPageData {
		return value !== null && value !== undefined && 'events' in value;
	}
</script>

<svelte:head>
	<title>{text.maintenanceEventsTitle} — OkoVision</title>
	<meta name="description" content={text.maintenanceEventsDescription} />
</svelte:head>

<main id="contenu" class="container reports-page seasons-page events-page">
	<h2>{text.maintenanceEventsTitle}</h2>
	<p class="reports-description">{text.maintenanceEventsDescription}</p>

	{#if formError}
		<p class="reports-alert" role="alert">{formError}</p>
	{/if}
	{#if viewData.databaseError}
		<p class="reports-alert" role="alert">{text.maintenanceEventsLoadFailed}</p>
	{/if}

	<div class="seasons-add">
		<button
			class="reports-button reports-button-primary"
			type="button"
			onclick={() => openEventDialog()}
			disabled={viewData.databaseError}
		>
			<svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
				<path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			</svg>
			{text.maintenanceEventsAdd}
		</button>
	</div>

	{#if !viewData.databaseError}
		<div class="reports-table-scroll">
			<table class="reports-table seasons-table events-table">
				<thead>
					<tr>
						<th scope="col">{text.maintenanceEventsType}</th>
						<th scope="col">{text.maintenanceEventsDate}</th>
						<th scope="col">{text.maintenanceEventsDetails}</th>
						<th scope="col">
							<span class="visually-hidden">{text.dailyReportsEditGraph} / {text.dailyReportsDelete}</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each viewData.events as event (event.id)}
						<tr>
							<td>{eventTypeLabels[event.eventType]}</td>
							<td>{displayDate(event.eventDate)}</td>
							<td>{eventDetails(event)}</td>
							<td class="reports-actions">
								<div class="reports-row-actions">
									<button
										class="reports-action-button"
										type="button"
										aria-label="{text.dailyReportsEditGraph}: {eventTypeLabels[event.eventType]} — {displayDate(event.eventDate)}"
										title="{text.dailyReportsEditGraph}: {eventTypeLabels[event.eventType]}"
										onclick={() => openEventDialog(event)}
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
										aria-label="{text.dailyReportsDelete}: {eventTypeLabels[event.eventType]} — {displayDate(event.eventDate)}"
										title="{text.dailyReportsDelete}: {eventTypeLabels[event.eventType]}"
										onclick={() => openDeleteDialog(event)}
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
					{#if !viewData.events.length}
						<tr>
							<td class="seasons-empty-cell" colspan="4">{text.maintenanceEventsEmpty}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}

	<dialog bind:this={eventDialog} class="reports-dialog" aria-labelledby="event-dialog-title">
		<form
			method="POST"
			use:enhance={closeEventDialogOnSuccess}
			class="reports-dialog-form"
		>
			<input type="hidden" name="operation" value={editingEvent ? 'update-event' : 'create-event'} />
			{#if editingEvent}
				<input type="hidden" name="eventId" value={editingEvent.id} />
			{/if}
			<div class="reports-dialog-heading">
				<h2 id="event-dialog-title">
					{editingEvent ? text.maintenanceEventEditTitle : text.maintenanceEventNewTitle}
				</h2>
				<button
					class="reports-dialog-close"
					type="button"
					aria-label={text.dailyReportsCancel}
					onclick={() => eventDialog?.close()}>×</button
				>
			</div>
			<label for="event-type">{text.maintenanceEventsType}</label>
			<select id="event-type" bind:this={eventTypeSelect} bind:value={eventType} name="eventType" required>
				{#each Object.entries(eventTypeLabels) as [value, label] (value)}
					<option value={value}>{label}</option>
				{/each}
			</select>
			<label for="event-date">{text.maintenanceEventDateLabel}</label>
			<input
				id="event-date"
				bind:value={eventDate}
				name="eventDate"
				type="date"
				max={todayDate()}
				required
				disabled={viewData.databaseError}
			/>
			{#if eventType === 'PELLET' || eventType === 'BAG'}
				<label for="event-quantity">{text.maintenanceEventQuantity}</label>
				<input
					id="event-quantity"
					bind:value={quantity}
					name="quantity"
					type="number"
					min="1"
					max="4294967295"
					step="1"
					required
					disabled={viewData.databaseError}
				/>
			{/if}
			{#if eventType === 'PELLET'}
				<label for="event-remaining">{text.maintenanceEventRemaining}</label>
				<input
					id="event-remaining"
					bind:value={remaining}
					name="remaining"
					type="number"
					min="0"
					max="2147483647"
					step="1"
					required
					disabled={viewData.databaseError}
				/>
			{/if}
			{#if eventType !== 'ASHES'}
				<label for="event-price">{text.maintenanceEventPrice}</label>
				<input
					id="event-price"
					bind:value={price}
					name="price"
					type="number"
					min="0"
					max="2147483647"
					step="1"
					required
					disabled={viewData.databaseError}
				/>
			{/if}
			<div class="reports-dialog-actions">
				<button class="reports-button" type="button" onclick={() => eventDialog?.close()}>
					{text.dailyReportsCancel}
				</button>
				<button class="reports-button reports-button-primary" type="submit" disabled={viewData.databaseError}>
					{editingEvent ? text.dailyReportsRename : text.maintenanceEventsAdd}
				</button>
			</div>
		</form>
	</dialog>

	<dialog
		bind:this={deleteEventDialog}
		class="reports-dialog"
		aria-labelledby="delete-event-dialog-title"
		aria-describedby="delete-event-name"
	>
		<form method="POST" use:enhance={closeDeleteDialogOnSuccess} class="reports-dialog-form">
			<input type="hidden" name="operation" value="delete-event" />
			<input type="hidden" name="eventId" value={eventToDelete?.id ?? ''} />
			<div class="reports-dialog-heading">
				<h2 id="delete-event-dialog-title">{text.maintenanceEventDeleteTitle}</h2>
				<button
					class="reports-dialog-close"
					type="button"
					aria-label={text.dailyReportsCancel}
					onclick={() => deleteEventDialog?.close()}>×</button
				>
			</div>
			<p id="delete-event-name" class="reports-dialog-target">
				{eventToDelete
					? `${eventTypeLabels[eventToDelete.eventType]} — ${displayDate(eventToDelete.eventDate)}`
					: ''}
			</p>
			<div class="reports-dialog-actions">
				<button class="reports-button" type="button" onclick={() => deleteEventDialog?.close()}>
					{text.dailyReportsCancel}
				</button>
				<button
					class="reports-button reports-button-danger"
					type="submit"
					disabled={viewData.databaseError || !eventToDelete}
				>
					{text.dailyReportsDelete}
				</button>
			</div>
		</form>
	</dialog>
</main>
