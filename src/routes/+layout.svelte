<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { Toaster } from 'svelte-sonner';
	import { uiMessages } from '#lib/i18n.js';
	import { navigationPages, type ScopePath } from '#lib/navigation.js';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	let text = $derived(uiMessages(data.language));
	let menuPages = $derived(navigationPages(data.language));
	let configurationOpen = $state(false);
	let accountOpen = $state(false);
	let configurationGroups = $derived([
		{ key: 'reports', title: text.reports },
		{ key: 'manual', title: text.manual },
		{ key: 'admin', title: text.admin },
		{ key: 'about', title: text.about }
	]);
	const pageHref = (path: ScopePath) => resolve(path);
	const current = (path: ScopePath) => data.pathname === path;
</script>

<svelte:window onkeydown={(event) => {
	if (event.key === 'Escape') {
		if (event.target instanceof HTMLElement) {
			event.target.closest('details[open]')?.querySelector('summary')?.focus();
		}
		configurationOpen = false;
		accountOpen = false;
	}
}} />

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
			<a href={resolve('/')} aria-current={data.pathname === '/' ? 'page' : undefined}>{text.home}</a>
			<a href={pageHref('/history')} aria-current={current('/history') ? 'page' : undefined}>{text.history}</a>
			{#if data.member}
				<a href={pageHref('/private/realtime/settings')} aria-current={data.pathname?.startsWith('/private/realtime/') ? 'page' : undefined}>{text.realtime}</a>
				<details class="nav-dropdown configuration-menu" bind:open={configurationOpen}>
					<summary class:active={menuPages.some((page) => configurationGroups.some((group) => group.key === page.group) && current(page.path))}>{text.configuration}<span class="chevron" aria-hidden="true">⌄</span></summary>
					<div class="dropdown-panel configuration-panel">
						{#each configurationGroups as group (group.key)}
							<div class="menu-group">
								<p>{group.title}</p>
								{#each menuPages.filter((page) => page.group === group.key) as item (item.path)}
									<a href={pageHref(item.path)} aria-current={current(item.path) ? 'page' : undefined} onclick={() => configurationOpen = false}>{item.title}</a>
								{/each}
							</div>
						{/each}
					</div>
				</details>
			{/if}
		</nav>
		<div class="member-access">
			{#snippet memberIcon()}
				<svg class="member-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
					<circle cx="12" cy="8" r="3.5" />
					<path d="M5 21v-2a7 7 0 0 1 14 0v2" />
				</svg>
			{/snippet}
			{#if data.member}
				<details class="nav-dropdown account-menu" bind:open={accountOpen}>
					<summary class="member-button" aria-label={text.memberArea}>
						<span class="member-avatar">{@render memberIcon()}</span>
						<span>{text.account}</span><span class="chevron" aria-hidden="true">⌄</span>
					</summary>
					<div class="dropdown-panel account-panel">
						<p class="member-name">{data.member.name}</p>
						<a href={pageHref('/private/account')} aria-current={current('/private/account') ? 'page' : undefined} onclick={() => accountOpen = false}>{text.account}</a>
						<form method="POST" action={resolve('/private/logout')}>
							<button type="submit">{text.logout}</button>
						</form>
					</div>
				</details>
			{:else}
				<a class="member-button" href={resolve('/login')} aria-current={data.pathname === '/login' ? 'page' : undefined}>
					<span class="member-avatar">{@render memberIcon()}</span>
					<span>{text.login}</span>
				</a>
			{/if}
		</div>
	</div>
</header>

{@render children()}

<footer class="site-footer">
	<div class="container footer-content">
		<span><strong>OkoVision</strong> · {text.boilerSupervision}</span>
		<span>SvelteKit · {text.applicationInProgress}</span>
	</div>
</footer>
