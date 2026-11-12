<script lang="ts">
	import { page } from '$app/state';
</script>

<main id="contenu" class="container">
	<h1>{page.status}</h1>
	<p>{page.error?.message}</p>
</main>
