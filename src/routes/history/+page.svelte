<script lang="ts">
  import { numberLocale, uiMessages } from "#lib/i18n.js";
  import { resolve } from "$app/paths";
  import type { PageProps } from "./$types";
  import HistoryChart from "#lib/components/HistoryChart.svelte";

  type IndicatorKey = "conso" | "ecs" | "max" | "mean" | "min" | "dju" | "cycles";
  type IndicatorGroup = {
    id: string;
    label: string;
    items: { id: string; key: IndicatorKey; label: string; unit: string; tone: string; digits: number }[];
  };

  let { data }: PageProps = $props();
  let text = $derived(uiMessages(data.language));
  let locale = $derived(numberLocale(data.language));
  let monthNames = $derived(
    Array.from({ length: 12 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
        new Date(Date.UTC(2020, index, 15)),
      ),
    ),
  );
  let indicatorGroups: IndicatorGroup[] = $derived([
    {
      id: "pellets",
      label: text.historyGroupPellets,
      items: [
        { id: "consumption", key: "conso", label: text.consumption, unit: "kg", tone: "blue", digits: 2 },
        { id: "hot-water", key: "ecs", label: text.historyHotWaterLabel, unit: "kg", tone: "blue", digits: 2 },
      ],
    },
    {
      id: "outside",
      label: text.historyGroupOutside,
      items: [
        { id: "max-outside", key: "max", label: text.maxOutside, unit: "°C", tone: "green", digits: 1 },
        { id: "average-outside", key: "mean", label: text.historyAverageOutside, unit: "°C", tone: "cyan", digits: 2 },
        { id: "min-outside", key: "min", label: text.minOutside, unit: "°C", tone: "orange", digits: 1 },
      ],
    },
    {
      id: "daily",
      label: text.historyGroupDaily,
      items: [
        { id: "degree-days", key: "dju", label: text.historyDegreeDays, unit: "", tone: "slate", digits: 2 },
        { id: "burner-cycles", key: "cycles", label: text.historyBurnerCycles, unit: "", tone: "amber", digits: 0 },
      ],
    },
  ]);

  function format(value: number | null, digits: number): string {
    return value === null
      ? text.unavailable
      : new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
  }

  function formatMonth(year: number, month: number): string {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 15)));
  }

  function adjacentMonth(direction: -1 | 1): { month: number; year: number } | null {
    const month = data.month + direction;
    const year = data.year + (month < 1 ? -1 : month > 12 ? 1 : 0);
    if (!data.years.includes(year)) return null;
    return { month: month < 1 ? 12 : month > 12 ? 1 : month, year };
  }

  let previousMonth = $derived(adjacentMonth(-1));
  let nextMonth = $derived(adjacentMonth(1));
</script>

<svelte:head>
  <title>{text.history} — OkoVision</title>
  <meta name="description" content={text.historyDescription} />
</svelte:head>

<main id="contenu" class="container history-page">
  <header class="history-heading">
    <h2>{text.history}</h2>
    <p class="eyebrow">{text.yourInstallation}</p>
    <p class="history-intro">{text.historyDescription}</p>
  </header>

  <section class="stock-summary" aria-labelledby="stock-title">
    <h2 id="stock-title">
      <svg class="stock-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M17 3C18 10 7 12 7 21a9 9 0 0 0 18 0c0-6-4-10-5-11 0 5-4 6-4 6s4-7 1-13Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        <path d="M16 20c-4 4-4 8 0 8s5-5 0-8Z" fill="currentColor" />
      </svg>
      {text.historyStockTitle}
    </h2>
    {#if data.stock.status === "available"}
      {@const boundedPercent = Math.max(0, Math.min(100, data.stock.percent))}
      {@const stockValue = `${format(data.stock.percent, 0)} % (${format(data.stock.remains, 0)} kg)`}
      <div
        class="stock-progress"
        role="progressbar"
        aria-labelledby="stock-title"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={boundedPercent}
        aria-valuetext={`${text.historyStockEstimate} : ${stockValue}`}
      >
        <div
          class="stock-fill"
          class:warning={data.stock.percent >= 25 && data.stock.percent <= 50}
          class:danger={data.stock.percent < 25}
          style={`width: ${boundedPercent}%`}
        ></div>
        <span class="stock-value" aria-hidden="true">{stockValue}</span>
      </div>
    {:else if data.stock.status === "no-fill"}
      <p>{text.historyStockNoFill}</p>
    {:else if data.stock.status === "no-consumption"}
      <p>{text.historyStockNoConsumption}</p>
    {:else if data.stock.status === "error"}
      <p role="alert">{text.historyStockError}</p>
    {:else}
      <p>{text.historyStockUnavailable}</p>
    {/if}
  </section>

  {#if data.databaseError}
    <p class="history-notice" role="alert">
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
  {/if}

  <section class="history-section" aria-labelledby="monthly-title">
    <div class="section-heading">
      <div>
        <h2 id="monthly-title">{text.historyMonthlyTitle}</h2>
      </div>
      <form method="GET" action={resolve("/history")} class="period-controls" aria-label={text.historyMonthlyTitle}>
        {#if data.selectedSeasonId !== null}
          <input type="hidden" name="season" value={data.selectedSeasonId} />
        {/if}
        {#if previousMonth}
          <a class="month-navigation"
            href="{resolve('/history')}?month={previousMonth.month}&year={previousMonth.year}{data.selectedSeasonId !== null ? `&season=${data.selectedSeasonId}` : ''}"
            aria-label={text.historyPreviousMonth}>‹</a>
        {:else}
          <span class="month-navigation disabled" aria-label={text.historyPreviousMonth} aria-disabled="true">‹</span>
        {/if}
        <label>
          <span class="visually-hidden">{text.historyMonth}</span>
          <select name="month" aria-label={text.historyMonth} disabled={data.years.length === 0}
            onchange={(event) => event.currentTarget.form?.requestSubmit()}>
            {#each monthNames as name, index (index)}
              <option value={index + 1} selected={data.month === index + 1}>{name}</option>
            {/each}
          </select>
        </label>
        <label>
          <span class="visually-hidden">{text.historyYear}</span>
          <select name="year" aria-label={text.historyYear} disabled={data.years.length === 0}
            onchange={(event) => event.currentTarget.form?.requestSubmit()}>
            {#each data.years as year (year)}
              <option value={year} selected={data.year === year}>{year}</option>
            {:else}
              <option selected>{text.historySelectionUnavailable}</option>
            {/each}
          </select>
        </label>
        {#if nextMonth}
          <a class="month-navigation"
            href="{resolve('/history')}?month={nextMonth.month}&year={nextMonth.year}{data.selectedSeasonId !== null ? `&season=${data.selectedSeasonId}` : ''}"
            aria-label={text.historyNextMonth}>›</a>
        {:else}
          <span class="month-navigation disabled" aria-label={text.historyNextMonth} aria-disabled="true">›</span>
        {/if}
        <noscript><button type="submit" disabled={data.years.length === 0}>{text.historyApply}</button></noscript>
      </form>
    </div>

    {@render MetricGroups({
      groups: indicatorGroups,
      label: text.historyMonthlyTitle,
      unavailable: text.unavailable,
      indicators: data.monthly?.indicators ?? null,
      format,
    })}

    <div class="chart-panel">
      <HistoryChart
        kind="monthly"
        language={data.language}
        today={data.today}
        monthlyData={data.monthly?.chart ?? null}
        seasonalData={null}
        hasData={Object.values(data.monthly?.chart ?? {}).some((series) => series.some((value) => value !== null))}
      />
    </div>
  </section>

  <section class="history-section" aria-labelledby="season-title">
    <div class="section-heading">
      <div>
        <h2 id="season-title">{text.historySeasonTitle}</h2>
      </div>
      <form method="GET" action={resolve("/history")} class="season-control" data-sveltekit-reset="false">
        <input type="hidden" name="month" value={data.month} />
        <input type="hidden" name="year" value={data.year} />
        <label>
          <span class="visually-hidden">{text.historySeason}</span>
          <select name="season" aria-label={text.historySeason} disabled={data.seasons.length === 0}
            onchange={(event) => event.currentTarget.form?.requestSubmit()}>
            {#each data.seasons as season (season.id)}
              <option value={season.id} selected={data.selectedSeasonId === season.id}>{season.name}</option>
            {:else}
              <option selected>{text.historySelectionUnavailable}</option>
            {/each}
          </select>
        </label>
        <noscript><button type="submit" disabled={data.seasons.length === 0}>{text.historyApply}</button></noscript>
      </form>
    </div>

    {@render MetricGroups({
      groups: indicatorGroups,
      label: text.historySeasonTitle,
      unavailable: text.unavailable,
      indicators: data.seasonal?.indicators ?? null,
      format,
    })}

    <div class="chart-panel">
      <HistoryChart
        kind="season"
        language={data.language}
        today={data.today}
        monthlyData={null}
        seasonalData={data.seasonal}
        hasData={data.seasonal?.months.some((month) =>
          `${month.year}-${String(month.month).padStart(2, "0")}` !== data.today.slice(0, 7)
          && [month.max, month.min, month.consumption, month.dju, month.cycles, month.ecs].some((value) => value !== null),
        ) ?? false}
      />
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
            {#if data.seasonal?.months.length}
              {#each data.seasonal.months as month (`${month.year}-${month.month}`)}
                <tr>
                  <td>{formatMonth(month.year, month.month)}</td>
                  <td>{@render TableValue(month.cycles, 0)}</td>
                  <td>{@render TableValue(month.dju, 2)}</td>
                  <td>{@render TableValue(month.consumption, 2)}</td>
                  <td>{@render TableValue(month.ecs, 2)}</td>
                  <td>{@render TableValue(month.efficiency, 2)}</td>
                </tr>
              {/each}
            {:else}
              <tr><td colspan="6">{text.historyTableUnavailable}</td></tr>
            {/if}
          </tbody>
        </table>
      </div>
    </section>
  </section>
</main>

{#snippet TableValue(value: number | null, digits: number)}
  {#if value === null}
    <span aria-hidden="true">-</span><span class="visually-hidden">{text.unavailable}</span>
  {:else}
    {format(value, digits)}
  {/if}
{/snippet}

{#snippet MetricGroups({
  groups,
  label,
  unavailable,
  indicators,
  format,
}: {
  groups: IndicatorGroup[];
  label: string;
  unavailable: string;
  indicators: {
    conso: number | null;
    ecs: number | null;
    max: number | null;
    mean: number | null;
    min: number | null;
    dju: number | null;
    cycles: number | null;
  } | null;
  format: (value: number | null, digits: number) => string;
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
                {#if indicators?.[indicator.key] == null}
                  <span aria-label={unavailable}>—</span>
                {:else}
                  {format(indicators[indicator.key], indicator.digits)}
                {/if}
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
    margin-bottom: 1.35rem;
  }
  .history-intro {
    max-width: 46rem;
    margin-top: 0.55rem;
    color: #64748b;
    font-size: 0.9rem;
  }
  .stock-summary {
    margin-bottom: 1rem;
  }
  .stock-mark {
    width: 1.15rem;
    height: 1.15rem;
    flex: none;
    color: #b87522;
  }
  .stock-summary h2 {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
    color: #34445a;
    font-size: 0.88rem;
    font-weight: 650;
  }
  .stock-summary p {
    color: var(--muted);
    font-size: 0.8rem;
  }
  .stock-progress {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 1.9rem;
    overflow: hidden;
    border: 1px solid #d5dfe6;
    border-radius: 6px;
    background: #e9eef2;
  }
  .stock-fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: #53a8cb;
  }
  .stock-fill.warning {
    background: #df9b32;
  }
  .stock-fill.danger {
    background: #cf514c;
  }
  .stock-value {
    position: relative;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    background: rgb(255 255 255 / 92%);
    color: #263648;
    font-size: 0.8rem;
    font-weight: 650;
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
    align-items: center;
    gap: 0.5rem;
  }
  .period-controls select,
  .season-control select {
    appearance: none;
    min-width: 7.8rem;
    padding: 0.55rem 2.2rem 0.55rem 0.7rem;
    border: 1px solid #aebdd0;
    border-radius: 7px;
    background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='m3 6 5 5 5-5' stroke='%2353647a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 0.75rem center / 0.85rem;
    color: #253247;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }
  .period-controls button,
  .season-control button,
  .month-navigation {
    padding: 0.55rem 0.75rem;
    border: 1px solid #aebdd0;
    border-radius: 7px;
    background: #f7f9fc;
    color: #34445a;
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .month-navigation {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    padding: 0.25rem 0.5rem;
    font-size: 1.2rem;
    line-height: 1.3;
    text-decoration: none;
  }
  .period-controls :disabled,
  .season-control :disabled,
  .month-navigation.disabled {
    color: #778398;
    cursor: not-allowed;
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

  @media (forced-colors: active) {
    .period-controls select,
    .season-control select {
      appearance: auto;
      background-image: none;
    }
  }

  @media (max-width: 900px) {
    .section-heading {
      display: flex;
      align-items: center;
      flex-direction: column;
    }
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
    .history-notice {
      align-items: flex-start;
      font-size: 0.76rem;
    }
    .history-section {
      margin-top: 1rem;
      padding: 0.8rem;
    }
    .section-heading h2 {
      font-size: 1.08rem;
    }
    .period-controls {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr) auto;
      width: 100%;
    }
    .period-controls label {
      min-width: 0;
    }
    .period-controls noscript {
      grid-column: 1 / -1;
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
