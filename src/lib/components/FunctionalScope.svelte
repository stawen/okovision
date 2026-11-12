<script lang="ts">
	import { resolve } from '$app/paths';
	import { findPage, navigationPages, type ScopePath } from '#lib/navigation.js';
	import { uiMessages, type Language } from '#lib/i18n.js';

	let { path, language }: { path: ScopePath; language: Language } = $props();
	let page = $derived(findPage(path));
	let text = $derived(uiMessages(language));
	let tabs = $derived(navigationPages(language).filter((page) => page.group === 'realtime'));
</script>

<svelte:head>
	<title>{text[page.titleKey]} — OkoVision</title>
	<meta name="description" content={text[page.descriptionKey]} />
</svelte:head>

<main id="contenu" class="container placeholder-page">
	{#if page.group === 'realtime'}
		<nav class="page-tabs" aria-label={text.realtime}>
			{#each tabs as tab (tab.path)}
				<a href={resolve(tab.path)} aria-current={path === tab.path ? 'page' : undefined}>{tab.title}</a>
			{/each}
		</nav>
	{/if}
	<p class="eyebrow">{text.scopeLabel}</p>
	<h1>{text[page.titleKey]}</h1>
	<p class="scope-description">{text[page.descriptionKey]}</p>
	<p class="scope-status">{text.pageNotImplemented}</p>
</main>
