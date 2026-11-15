<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { setContext } from 'svelte';
	import { BoilerDraft, boilerDraftContext } from '#lib/boiler-draft.svelte.js';
	import { boilerConfigurationText } from '#lib/ui/boiler-configurations.js';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	const draft = new BoilerDraft();
	setContext(boilerDraftContext, draft);

	beforeNavigate(({ to, cancel }) => {
		if (draft.busy) {
			cancel();
			return;
		}
		if (draft.dirty && to?.url.pathname && !to.url.pathname.includes('/private/realtime/')) {
			if (!window.confirm(boilerConfigurationText(data.language).leave)) cancel();
		}
	});

	function beforeUnload(event: BeforeUnloadEvent) {
		if (draft.dirty) event.preventDefault();
	}
</script>

<svelte:window onbeforeunload={beforeUnload} />
{@render children()}
