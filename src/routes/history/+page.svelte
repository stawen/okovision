<script lang="ts">
  import { uiMessages } from "#lib/i18n.js";
  import type { PageProps } from "./$types";
  import HistoryChart from "#lib/components/HistoryChart.svelte";

  let { data }: PageProps = $props();
  let text = $derived(uiMessages(data.language));
  let indicatorGroups = $derived([
    {
      id: "pellets",
      label: text.historyGroupPellets,
      items: [
        { id: "consumption", label: text.consumption, unit: "kg", tone: "blue" },
        { id: "hot-water", label: text.historyHotWaterLabel, unit: "kg", tone: "blue" },
      ],
    },
    {
      id: "outside",
      label: text.historyGroupOutside,
      items: [
        { id: "max-outside", label: text.maxOutside, unit: "°C", tone: "green" },
        { id: "average-outside", label: text.historyAverageOutside, unit: "°C", tone: "cyan" },
        { id: "min-outside", label: text.minOutside, unit: "°C", tone: "orange" },
      ],
    },
    {
      id: "daily",
      label: text.historyGroupDaily,
      items: [
        { id: "degree-days", label: text.historyDegreeDays, unit: "", tone: "slate" },
        { id: "burner-cycles", label: text.historyBurnerCycles, unit: "", tone: "amber" },
      ],
    },
  ]);
</script>

<svelte:head>
  <title>{text.history} — OkoVision</title>
  <meta name="description" content={text.historyDescription} />
</svelte:head>

<main id="contenu" class="container history-page">
  <header class="history-heading">
    <div>
      <h2>{text.history}</h2>
      <p class="eyebrow">{text.yourInstallation}</p>
      <p class="history-intro">{text.historyDescription}</p>
    </div>
    <div class="stock-summary" aria-label={text.historyStockTitle}>
      <span class="stock-mark" aria-hidden="true">◈</span>
      <div>
        <h2>{text.historyStockTitle}</h2>
        <p>{text.historyStockUnavailable}</p>
      </div>
    </div>
  </header>

  <p class="history-notice" role="status">
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 6v4m0 3h.01M10 2.5l8 14H2l8-14Z"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span>{text.historyDataUnavailable}</span>
  </p>

  <section class="history-section" aria-labelledby="monthly-title">
    <div class="section-heading">
      <div>
        <h2 id="monthly-title">{text.historyMonthlyTitle}</h2>
      </div>
      <div class="period-controls" aria-label={text.historyMonthlyTitle}>
        <label>
          <span class="visually-hidden">{text.historyMonth}</span>
          <select disabled aria-label={text.historyMonth}>
            <option selected>{text.historySelectionUnavailable}</option>
          </select>
        </label>
        <label>
          <span class="visually-hidden">{text.historyYear}</span>
          <select disabled aria-label={text.historyYear}>
            <option selected>{text.historySelectionUnavailable}</option>
          </select>
        </label>
      </div>
    </div>

    {@render MetricGroups({
      groups: indicatorGroups,
      label: text.historyMonthlyTitle,
      unavailable: text.unavailable,
    })}

    <div class="chart-panel">
      <HistoryChart kind="monthly" language={data.language} />
    </div>
  </section>

  <section class="history-section" aria-labelledby="season-title">
    <div class="section-heading">
      <div>
        <h2 id="season-title">{text.historySeasonTitle}</h2>
      </div>
      <label class="season-control">
        <span class="visually-hidden">{text.historySeason}</span>
        <select disabled aria-label={text.historySeason}>
          <option selected>{text.historySelectionUnavailable}</option>
        </select>
      </label>
    </div>

    {@render MetricGroups({
      groups: indicatorGroups,
      label: text.historySeasonTitle,
      unavailable: text.unavailable,
    })}

    <div class="chart-panel">
      <HistoryChart kind="season" language={data.language} />
    </div>

    <section class="table-panel" aria-labelledby="season-table-title">
      <div class="table-heading">
        <h3 id="season-table-title">{text.historySeasonTable}</h3>
      </div>
      <div class="table-scroll">
        <table>
          <caption class="visually-hidden">{text.historySeasonTable}</caption>
          <thead>
            <tr>
              <th scope="col">{text.historyMonth}</th>
              <th scope="col">{text.historyTableCycle}</th>
              <th scope="col">{text.historyTableDju}</th>
              <th scope="col">{text.historyTableConsumption}</th>
              <th scope="col">{text.historyTableEcs}</th>
              <th scope="col">{text.historyTableEfficiency}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="6">{text.historyTableUnavailable}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</main>

{#snippet MetricGroups({
  groups,
  label,
  unavailable,
}: {
  groups: {
    id: string;
    label: string;
    items: { id: string; label: string; unit: string; tone: string }[];
  }[];
  label: string;
  unavailable: string;
})}
  <div class="metric-groups" role="group" aria-label={label}>
    {#each groups as group (group.id)}
      <section class="metric-group" aria-label={group.label}>
        <h3 class="metric-group-title">{group.label}</h3>
        <div class="metric-group-items" style={`--metric-columns: ${group.items.length}`}>
          {#each group.items as indicator (indicator.id)}
            <div class="metric">
              <span class="metric-label">
                {indicator.label}
              </span>
              <strong class="metric-reading {indicator.tone}">
                <span aria-label={unavailable}>—</span>
                {#if indicator.unit}<small>{indicator.unit}</small>{/if}
              </strong>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
{/snippet}

<style>
  .history-page {
    padding-block: 2rem 3.5rem;
  }
  .history-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 1.35rem;
  }
  .history-intro {
    max-width: 46rem;
    margin-top: 0.55rem;
    color: #64748b;
    font-size: 0.9rem;
  }
  .stock-summary {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 15rem;
    padding: 0.8rem 1rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }
  .stock-mark {
    color: #b87522;
    font-size: 1.5rem;
    line-height: 1;
  }
  .stock-summary h2 {
    color: #34445a;
    font-size: 0.78rem;
    font-weight: 650;
  }
  .stock-summary p {
    margin-top: 0.1rem;
    color: var(--muted);
    font-size: 0.72rem;
  }
  .history-notice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem 1rem;
    border: 1px solid #e8d6a5;
    border-radius: 9px;
    background: #fff9e9;
    color: #725a25;
    font-size: 0.82rem;
  }
  .history-notice svg {
    flex: 0 0 1.2rem;
    width: 1.2rem;
    height: 1.2rem;
  }
  .history-section {
    margin-top: 1.4rem;
    padding: 1.2rem;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--surface);
    box-shadow: 0 4px 16px rgb(34 54 78 / 3%);
  }
  .section-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.9rem;
  }
  .section-heading > div:first-child {
    grid-column: 2;
    justify-self: center;
    text-align: center;
  }
  .section-heading .period-controls,
  .section-heading .season-control {
    grid-column: 3;
    justify-self: end;
  }
  .section-heading h2 {
    color: #253247;
    font-size: 1.2rem;
    font-weight: 650;
    letter-spacing: -0.025em;
    text-align: center;
  }
  .period-controls {
    display: flex;
    gap: 0.5rem;
  }
  .period-controls select,
  .season-control select {
    min-width: 7.8rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: #f7f9fc;
    color: #778398;
    font: inherit;
    font-size: 0.78rem;
  }
  .metric-groups {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 1.75rem;
    margin-bottom: 0.85rem;
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 0.95rem 1.15rem;
    background: var(--surface);
  }
  .metric-group {
    min-width: 0;
  }
  .metric-group-title {
    margin-bottom: 0.65rem;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-align: center;
  }
  .metric-group + .metric-group {
    border-left: 1px solid var(--border);
    padding-left: 1.75rem;
  }
  .metric-group-items {
    display: grid;
    grid-template-columns: repeat(var(--metric-columns), minmax(0, 1fr));
    gap: 0.75rem;
  }
  .metric {
    min-width: 0;
    text-align: center;
  }
  .metric-reading.green {
    color: #368952;
  }
  .metric-reading.cyan {
    color: #338796;
  }
  .metric-reading.orange {
    color: #a76e24;
  }
  .metric-reading.slate {
    color: #666b73;
  }
  .metric-reading.amber {
    color: #997124;
  }
  .metric-label {
    color: #53647a;
    font-size: 0.73rem;
    font-weight: 650;
    white-space: nowrap;
  }
  .metric-reading {
    display: block;
    margin-top: 0.3rem;
    color: #4775a4;
    font-size: 1.1rem;
    font-weight: 650;
    line-height: 1.2;
    text-align: center;
  }
  .metric-reading small {
    margin-left: 0.2rem;
    font-size: 0.72rem;
    font-weight: 550;
  }
  .chart-panel {
    overflow: hidden;
    border: 1px solid #edf1f5;
    border-radius: 9px;
  }
  .table-panel {
    margin-top: 1rem;
    border: 1px solid var(--border);
    border-radius: 9px;
    overflow: hidden;
  }
  .table-heading {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--border);
    background: #fbfcfe;
  }
  .table-heading h3 {
    color: #34445a;
    font-size: 0.88rem;
    font-weight: 650;
  }
  .table-scroll {
    overflow-x: auto;
  }
  table {
    width: 100%;
    min-width: 40rem;
    border-collapse: collapse;
    font-size: 0.78rem;
  }
  th,
  td {
    padding: 0.7rem 0.85rem;
    border-bottom: 1px solid #edf1f5;
    text-align: left;
  }
  th {
    color: #596a80;
    background: #fff;
    font-weight: 650;
  }
  td {
    color: var(--muted);
    text-align: center;
  }
  tbody tr:last-child td {
    border-bottom: 0;
  }

  @media (max-width: 900px) {
    .metric-groups {
      grid-template-columns: minmax(0, 1fr);
      gap: 1.1rem;
    }
    .metric-group-items {
      gap: 0.5rem;
    }
    .metric-group + .metric-group {
      border-top: 1px solid var(--border);
      border-left: 0;
      padding-top: 1rem;
      padding-left: 0;
    }
  }
  @media (max-width: 640px) {
    .metric-groups {
      gap: 0.95rem;
      padding: 0.85rem;
    }
  }
  @media (max-width: 640px) {
    .history-page {
      padding-block: 1.4rem 2.5rem;
    }
    .history-heading {
      align-items: stretch;
      flex-direction: column;
      gap: 1rem;
    }
    .stock-summary {
      min-width: 0;
    }
    .history-notice {
      align-items: flex-start;
      font-size: 0.76rem;
    }
    .history-section {
      margin-top: 1rem;
      padding: 0.8rem;
    }
    .section-heading {
      display: flex;
      align-items: center;
      flex-direction: column;
    }
    .section-heading h2 {
      font-size: 1.08rem;
    }
    .period-controls {
      width: 100%;
    }
    .period-controls label {
      flex: 1;
      min-width: 0;
    }
    .period-controls select,
    .season-control,
    .season-control select {
      width: 100%;
      min-width: 0;
    }
    .metric-label {
      font-size: 0.66rem;
    }
    .metric-reading {
      font-size: 1rem;
    }
    .metric-reading small {
      font-size: 0.68rem;
    }
  }
</style>
