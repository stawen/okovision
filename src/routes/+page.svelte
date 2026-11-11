<script lang="ts">
	const indicators = [
		{ label: 'Conso', unit: 'kg', tone: 'blue' },
		{ label: 'dont ECS', unit: 'kg', tone: 'blue' },
		{ label: 'T° max ext.', unit: '°C', tone: 'green' },
		{ label: 'T° min ext.', unit: '°C', tone: 'orange' }
	];

	const series = [
		{ label: 'T° extérieure', tone: 'sky' },
		{ label: 'T° ambiante', tone: 'slate' },
		{ label: 'T° ambiante consigne', tone: 'green' },
		{ label: 'T° départ', tone: 'orange' }
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
				<p class="eyebrow">SUPERVISION</p>
				<h1 id="page-title">Vue d’ensemble</h1>
			</div>
			<div class="date-control" aria-label="Sélection de la journée">
				<button type="button" aria-label="Jour précédent" disabled>‹</button>
				<span class="date-label">
					<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
						<rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5" />
						<path d="M6.5 3v4M13.5 3v4M3 9h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
					Journée indisponible
				</span>
				<button type="button" aria-label="Jour suivant" disabled>›</button>
			</div>
		</div>

		<div class="notice" role="status">
			<span class="notice-icon" aria-hidden="true">
				<svg viewBox="0 0 20 20" fill="none">
					<path d="M10 6v4m0 3h.01M10 2.5l8 14H2l8-14Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</span>
			<p>
				<strong>Votre tableau de suivi est en attente de connexion.</strong>
				Les relevés s’afficheront ici dès que la liaison à la chaudière sera disponible.
			</p>
		</div>

		<section class="indicator-grid" aria-label="Indicateurs de la journée">
			{#each indicators as indicator (indicator.label)}
				<article class="indicator {indicator.tone}">
					<h2>{indicator.label}</h2>
					<p class="indicator-value">
						<span class="indicator-reading" aria-label="Non disponible">— <span>{indicator.unit}</span></span>
					</p>
				</article>
			{/each}
		</section>

		<section class="panel" aria-labelledby="measurements-title">
			<div class="panel-heading">
				<p class="eyebrow">VOTRE INSTALLATION</p>
				<h2 id="measurements-title">Températures</h2>
				<p>Évolution des températures au fil de la journée</p>
			</div>

			<div
				class="chart-area"
				role="img"
				aria-label="Graphique des températures vide, les données ne sont pas encore disponibles"
			>
				<div class="chart-y-axis" aria-hidden="true">
					<span>50°</span><span>40°</span><span>30°</span><span>20°</span><span>10°</span>
				</div>
				<div class="chart-plot">
					<div class="chart-gridlines" aria-hidden="true">
						<span></span><span></span><span></span><span></span><span></span>
					</div>
					<div class="chart-empty">
						<span class="chart-empty-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none">
								<path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</span>
						<strong>Aucun relevé pour le moment</strong>
						<span>Les courbes apparaîtront dès la réception des premières mesures.</span>
					</div>
					<div class="chart-x-axis" aria-hidden="true">
						<span>00 h</span><span>04 h</span><span>08 h</span><span>12 h</span><span>16 h</span><span>20 h</span><span>24 h</span>
					</div>
				</div>
			</div>

			<ul class="chart-legend" aria-label="Séries du graphique">
				{#each series as item (item.label)}
					<li><span class="legend-line {item.tone}" aria-hidden="true"></span>{item.label}</li>
				{/each}
			</ul>
			<div class="panel-footnote">Aucune donnée simulée · Connexion à la chaudière en préparation</div>
		</section>
	</section>

	<section id="migration" class="migration-section" aria-labelledby="migration-title">
		<div class="section-heading">
			<div>
				<p class="eyebrow">UNE TRANSITION PROGRESSIVE</p>
				<h2 id="migration-title">Une nouvelle base, la même identité.</h2>
				<p class="intro">Les sources historiques sont conservées. Les fonctionnalités seront portées par étapes.</p>
			</div>
			<span class="badge">En construction</span>
		</div>
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
