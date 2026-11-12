<script lang="ts">
	import { enhance } from '$app/forms';
	import { uiMessages } from '#lib/i18n.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let text = $derived(uiMessages(data.language));
	let pending = $state(false);
</script>

<svelte:head>
	<title>{text.login} — OkoVision</title>
</svelte:head>

<main id="contenu" class="container login-page">
	<section class="login-panel" aria-labelledby="login-title">
		<div class="login-emblem" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
		</div>
		<p class="eyebrow">{text.memberArea}</p>
		<h1 id="login-title">{text.login}</h1>
		<p class="login-intro">{text.loginDescription}</p>
		<form method="POST" use:enhance={() => {
			pending = true;
			return async ({ update }) => {
				try { await update(); } finally { pending = false; }
			};
		}}>
			<label for="username">{text.username}</label>
			<input id="username" name="username" autocomplete="username" maxlength="255" required />
			<label for="password">{text.password}</label>
			<input id="password" name="password" type="password" autocomplete="current-password" maxlength="1024" required />
			{#if form?.message}<p class="form-error" role="alert">{form.message}</p>{/if}
			<button class="primary-button" type="submit" disabled={pending}>{pending ? text.loggingIn : text.login}</button>
		</form>
	</section>
</main>
