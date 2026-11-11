<script lang="ts">
	const indicators = [
		{ label: 'Consommation de granulés', unit: 'kg', detail: 'Total de la journée', tone: 'primary' },
		{ label: 'Eau chaude sanitaire', unit: 'kg', detail: 'Consommation ECS', tone: 'info' },
		{ label: 'Température maximale', unit: '°C', detail: 'Température extérieure', tone: 'success' },
		{ label: 'Température minimale', unit: '°C', detail: 'Température extérieure', tone: 'warning' }
	];
</script>

<svelte:head>
	<title>OkoVision — Supervision de votre chaudière</title>
	<meta
		name="description"
		content="Le nouveau socle OkoVision pour la supervision de votre chaudière Ökofen. Migration vers SvelteKit en cours."
	/>
</svelte:head>

<main id="contenu" class="container">
	<section id="supervision" class="overview" aria-labelledby="page-title">
		<div class="page-heading">
			<div>
				<p class="eyebrow">TABLEAU DE BORD</p>
				<h1 id="page-title">Votre chauffage, en un coup d’œil.</h1>
				<p class="intro">Consommation, températures et suivi de votre chaudière.</p>
			</div>
			<span class="badge">Socle SvelteKit</span>
		</div>

		<div class="notice">
			<span class="notice-icon" aria-hidden="true">i</span>
			<p>
				<strong>Migration en cours.</strong> La nouvelle interface est prête à accueillir vos données.
				Aucune base ni chaudière n’est connectée à ce stade.
			</p>
		</div>

		<div class="indicator-grid">
			{#each indicators as indicator (indicator.label)}
				<article class="indicator {indicator.tone}">
					<h2>{indicator.label}</h2>
					<p class="indicator-value">
						<span aria-label="Non disponible">—</span>
						<span class="unit">{indicator.unit}</span>
					</p>
					<p class="indicator-detail">{indicator.detail} · En attente de données</p>
				</article>
			{/each}
		</div>

		<section class="panel" aria-labelledby="measurements-title">
			<div class="panel-heading">
				<div>
					<h2 id="measurements-title">Mesures journalières</h2>
					<p>Évolution de la consommation et des températures</p>
				</div>
				<span class="status-label">Non connecté</span>
			</div>
			<div class="empty-state">
				<svg viewBox="0 0 64 64" width="64" height="64" fill="none" aria-hidden="true">
					<path d="M10 10v44h44" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
					<path d="m18 39 10-12 10 7 13-16" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<h3>Les mesures arrivent à la prochaine étape</h3>
				<p>
					La connexion en lecture seule à MySQL et le portage des graphiques permettront
					d’afficher ici vos relevés réels.
				</p>
				<a class="button" href="#migration">Voir les prochaines étapes <span aria-hidden="true">→</span></a>
			</div>
			<div class="panel-footnote">Aucune donnée simulée. Aucun appel à l’ancienne application PHP.</div>
		</section>
	</section>

	<section id="migration" class="migration-section" aria-labelledby="migration-title">
		<p class="eyebrow">UNE TRANSITION PROGRESSIVE</p>
		<h2 id="migration-title">Une nouvelle base, la même identité.</h2>
		<p class="intro">Les sources historiques sont conservées. Les fonctionnalités seront portées par étapes.</p>
		<ol class="roadmap">
			<li class="completed">
				<span class="step-number" aria-hidden="true">1</span>
				<div>
					<span class="step-status">Socle initialisé</span>
					<h3>Archive et nouvelle interface</h3>
					<p>Sources PHP isolées, SvelteKit et TypeScript strict, couleurs historiques préservées.</p>
				</div>
			</li>
			<li>
				<span class="step-number" aria-hidden="true">2</span>
				<div>
					<span class="step-status">Prochaine étape</span>
					<h3>Retrouver vos mesures</h3>
					<p>Connexion MySQL en lecture seule, capteurs, journée et graphiques comparés à l’historique.</p>
				</div>
			</li>
			<li>
				<span class="step-number" aria-hidden="true">3</span>
				<div>
					<span class="step-status">À porter ensuite</span>
					<h3>Compléter la supervision</h3>
					<p>Authentification, historique, administration, imports et interactions avec la chaudière.</p>
				</div>
			</li>
		</ol>
	</section>
</main>
