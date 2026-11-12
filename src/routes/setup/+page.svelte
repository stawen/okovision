<script lang="ts">
	import FunctionalScope from '#lib/components/FunctionalScope.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<FunctionalScope path="/setup" language={data.language} />
