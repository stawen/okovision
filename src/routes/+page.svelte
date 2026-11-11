<script lang="ts">
  import { toast } from "svelte-sonner";
  import { resolve } from "$app/paths";
  import { enhance } from "$app/forms";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();
  let current = $derived(form ?? data);
  let pending = $state(false);
  const numberFormat = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let indicators = $derived([
    { label: "Conso", unit: "kg", tone: "blue", value: current.indicators?.conso ?? null },
    { label: "dont ECS", unit: "kg", tone: "blue", value: current.indicators?.ecs ?? null },
    { label: "T° max ext.", unit: "°C", tone: "green", value: current.indicators?.max ?? null },
    { label: "T° min ext.", unit: "°C", tone: "orange", value: current.indicators?.min ?? null },
  ]);

  $effect(() => {
    if (current.databaseError) {
      toast.error("Impossible de charger les indicateurs.", { id: `indicateurs-${current.day}` });
    }
  });

  const series = [
    { label: "T° extérieure", tone: "sky" },
    { label: "T° ambiante", tone: "slate" },
    { label: "T° ambiante consigne", tone: "green" },
    { label: "T° départ", tone: "orange" },
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
        <h1 id="page-title">Vue journalière</h1>
      </div>
      <div class="date-control" aria-label="Sélection de la journée">
        <form
          method="POST"
          action={resolve("/")}
          use:enhance={() => {
            pending = true;
            return async ({ update }) => {
              try {
                await update({ reset: false, refreshAll: false, navigate: false });
              } finally {
                pending = false;
              }
            };
          }}
        >
          <button
            type="submit"
            name="direction"
            value="-1"
            aria-label="Jour précédent"
            disabled={pending || !current.previous}>‹</button
          >
          <label class="date-label">
            <span class="visually-hidden">Choisir une journée</span>
            <input
              type="date"
              name="jour"
              value={current.day}
              max={current.today}
              min="1000-01-01"
              required
              disabled={pending}
              onchange={(event) => event.currentTarget.form?.requestSubmit()}
            />
          </label>

          <button type="submit" name="direction" value="1" aria-label="Jour suivant" disabled={pending || !current.next}
            >›</button
          >
        </form>
      </div>
    </div>

    {#if current.databaseError || current.indicators?.sampleCount === 0 || current.indicators?.missingSensors}
      <div class="notice" role={current.databaseError ? "alert" : "status"}>
        <span class="notice-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M10 6v4m0 3h.01M10 2.5l8 14H2l8-14Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <p>
          {#if current.databaseError}
            <strong>Impossible de charger les indicateurs.</strong> Vérifiez la connexion et la configuration de la base.
          {:else if current.indicators?.sampleCount === 0}
            <strong>Aucun relevé pour cette journée.</strong> Les indicateurs ne sont pas disponibles.
          {:else}
            <strong>Certains indicateurs sont indisponibles.</strong> Un ou plusieurs capteurs nécessaires sont absents.
          {/if}
        </p>
      </div>
    {/if}

    <section class="indicator-grid" aria-label="Indicateurs de la journée">
      {#each indicators as indicator (indicator.label)}
        <article class="indicator {indicator.tone}">
          <h2>{indicator.label}</h2>
          <p class="indicator-value">
            {#if indicator.value === null}
              <span class="indicator-reading" aria-label="Non disponible">— <span>{indicator.unit}</span></span>
            {:else}
              <span class="indicator-reading">{numberFormat.format(indicator.value)} <span>{indicator.unit}</span></span
              >
            {/if}
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
        aria-label="Graphique des températures indisponible, fonctionnalité en cours de migration"
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
                <path
                  d="M4 19V5m0 14h16M7 15l4-4 3 2 5-6"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <strong>Graphique en cours de migration</strong>
            <span>Les courbes ne sont pas encore disponibles.</span>
          </div>
          <div class="chart-x-axis" aria-hidden="true">
            <span>00 h</span><span>04 h</span><span>08 h</span><span>12 h</span><span>16 h</span><span>20 h</span><span
              >24 h</span
            >
          </div>
        </div>
      </div>

      <ul class="chart-legend" aria-label="Séries du graphique">
        {#each series as item (item.label)}
          <li><span class="legend-line {item.tone}" aria-hidden="true"></span>{item.label}</li>
        {/each}
      </ul>
      <div class="panel-footnote">Graphique en cours de migration</div>
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
