<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { Toaster } from 'svelte-sonner';
	import { uiMessages } from '#lib/i18n.js';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	let text = $derived(uiMessages(data.language));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#222222" />
</svelte:head>

<a class="skip-link" href="#contenu">{text.skipLink}</a>

<Toaster position="top-right" richColors closeButton containerAriaLabel={text.notifications} closeButtonAriaLabel={text.closeNotification} pauseWhenPageIsHidden />

<header class="site-header">
	<div class="container header-content">
		<a class="brand" href={resolve('/')} aria-label={text.homeBrand}>
			<svg class="brand-flame" viewBox="0 0 32 32" width="30" height="30" fill="none" aria-hidden="true">
				<path d="M17 3C18 10 7 12 7 21a9 9 0 0 0 18 0c0-6-4-10-5-11 0 5-4 6-4 6s4-7 1-13Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
				<path d="M16 20c-4 4-4 8 0 8s5-5 0-8Z" fill="currentColor" />
			</svg>
			Oko<span>Vision</span>
		</a>
		<nav aria-label={text.mainNavigation}>
			<a href={resolve('/#supervision')} aria-current="page">{text.home}</a>
			<span class="nav-link disabled" aria-disabled="true" title={text.historyUnavailable}>{text.history}</span>
			<a href={resolve('/#migration')}>{text.migration}</a>
		</nav>
		<span class="header-label">{text.newApplication}</span>
	</div>
</header>

{@render children()}

<footer class="site-footer">
	<div class="container footer-content">
		<span><strong>OkoVision</strong> · {text.boilerSupervision}</span>
		<span>SvelteKit · {text.applicationInProgress}</span>
	</div>
</footer>
