<script lang="ts">
	import { enhance } from '$app/forms';
	import { uiMessages } from '#lib/ui/i18n.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let pending = $state(false);
</script>

<svelte:head>
	<title>{text.changePassword} — OkoVision</title>
</svelte:head>

<main id="contenu" class="container login-page">
	<section class="login-panel" aria-labelledby="account-title">
		<h1 id="account-title">{text.changePassword}</h1>
		<p class="login-intro">{text.passwordChangeDescription}</p>
		<form method="POST" use:enhance={() => {
			pending = true;
			return async ({ update }) => {
				try { await update(); } finally { pending = false; }
			};
		}}>
			<label for="currentPassword">{text.currentPassword}</label>
			<input id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" maxlength="1024" required />
			<label for="newPassword">{text.newPassword}</label>
			<input id="newPassword" name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="1024" required />
			<label for="confirmPassword">{text.confirmNewPassword}</label>
			<input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="1024" required />
			{#if form?.message}<p class="form-error" role="alert">{form.message}</p>{/if}
			<button class="primary-button" type="submit" disabled={pending}>{pending ? text.passwordChangeSaving : text.passwordChangeSave}</button>
		</form>
	</section>
</main>
