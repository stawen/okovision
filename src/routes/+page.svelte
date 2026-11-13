<script lang="ts">
  import { toast } from "svelte-sonner";
  import { resolve } from "$app/paths";
  import { enhance } from "$app/forms";
  import DailyChart from "#lib/components/DailyChart.svelte";
  import { createDailyChartSync } from "#lib/chart-sync.js";
  import { isDailyIndicators, type ChartRange, type DailyIndicators } from "#lib/daily-indicators.js";
  import { numberLocale, uiMessages } from "#lib/i18n.js";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();
  let current = $derived(form ?? data);
  let zoom = $state.raw<{ source: typeof current; range: ChartRange } | null>(null);
  let chartSync = $derived.by(() => {
    const source = current;
    return createDailyChartSync((range) => {
      zoom = range ? { source, range } : null;
    });
  });
  let selectedRange = $derived(zoom?.source === current ? zoom.range : null);
  let rangeResult = $state.raw<{
    source: typeof current;
    range: ChartRange;
    indicators: DailyIndicators | null;
    error: boolean;
  } | null>(null);
  let rangeMatches = $derived(rangeResult?.source === current && rangeResult?.range === selectedRange);
  let displayedIndicators = $derived(selectedRange ? (rangeMatches ? rangeResult?.indicators : null) : current.indicators);
  let indicatorError = $derived(selectedRange ? rangeMatches && rangeResult?.error : current.databaseError);
  let indicatorsLoading = $derived(Boolean(selectedRange && !rangeMatches));
  let pending = $state(false);
  let text = $derived(uiMessages(data.language));
  let numberFormat = $derived(
    new Intl.NumberFormat(numberLocale(data.language), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  );
  let timeFormat = $derived(
    new Intl.DateTimeFormat(numberLocale(data.language), {
      timeZone: "UTC", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }),
  );
  let indicators = $derived([
    { id: "consumption", label: text.consumption, unit: "kg", tone: "blue", value: displayedIndicators?.conso ?? null },
    {
      id: "hotWater",
      label: text.hotWaterConsumption,
      unit: "kg",
      tone: "blue",
      value: displayedIndicators?.ecs ?? null,
    },
    { id: "maxOutside", label: text.maxOutside, unit: "°C", tone: "green", value: displayedIndicators?.max ?? null },
    { id: "minOutside", label: text.minOutside, unit: "°C", tone: "orange", value: displayedIndicators?.min ?? null },
  ]);

  $effect(() => {
    const range = selectedRange;
    const source = current;
    const failureMessage = text.indicatorsError;
    if (!range) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const parameters = new URLSearchParams({
          jour: source.day, min: String(range.min), max: String(range.max),
        });
        const response = await fetch(`${resolve("/api/v1/indicators")}?${parameters}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(failureMessage);
        const result: unknown = await response.json();
        if (!isDailyIndicators(result)) throw new Error(failureMessage);
        if (!controller.signal.aborted) {
          rangeResult = { source, range, indicators: result, error: false };
        }
      } catch (cause) {
        if (controller.signal.aborted) return;
        console.error(failureMessage, cause);
        rangeResult = { source, range, indicators: null, error: true };
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  });

  $effect(() => {
    if (indicatorError) {
      toast.error(text.indicatorsError, { id: `indicateurs-${current.day}` });
    }
  });
</script>

<svelte:head>
  <title>{text.pageTitle}</title>
  <meta name="description" content={text.pageDescription} />
</svelte:head>

<main id="contenu" class="container">
  <section id="supervision" class="overview" aria-labelledby="page-title">
    <div class="page-heading">
      <div>
        <h2 id="daily-charts-title">{text.dailyCharts}</h2>
        <p class="eyebrow">{text.yourInstallation}</p>
      </div>
      <div class="date-control" aria-label={text.daySelection}>
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
            aria-label={text.previousDay}
            disabled={pending || !current.previous}>‹</button
          >
          <label class="date-label">
            <span class="visually-hidden">{text.selectDay}</span>
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

          <button type="submit" name="direction" value="1" aria-label={text.nextDay} disabled={pending || !current.next}
            >›</button
          >
        </form>
      </div>
    </div>

    {#if current.ashtray === "full"}
      <div class="notice" role="alert">
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
          <strong>{text.ashtrayFull}</strong> {text.ashtrayFullDetails}
        </p>
      </div>
    {/if}

    {#if indicatorError || displayedIndicators?.sampleCount === 0 || displayedIndicators?.missingSensors}
      <div class="notice" role={indicatorError ? "alert" : "status"}>
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
          {#if indicatorError}
            <strong>{text.indicatorsError}</strong> {text.databaseAdvice}
          {:else if displayedIndicators?.sampleCount === 0}
            <strong>{selectedRange ? text.noRangeReadings : text.noReadings}</strong> {text.indicatorsUnavailable}
          {:else}
            <strong>{text.missingIndicators}</strong> {text.missingSensors}
          {/if}
        </p>
      </div>
    {/if}

    {#if selectedRange}
      <div class="range-controls">
        <p role="status">
          {indicatorsLoading ? text.indicatorsLoading : text.rangeIndicators}
          : {timeFormat.format(selectedRange.min)} – {timeFormat.format(selectedRange.max)}
        </p>
        <button type="button" onclick={() => chartSync.reset()}>{text.resetChartRange}</button>
      </div>
    {/if}
    <section class="indicator-grid" aria-label={selectedRange ? text.rangeIndicators : text.dailyIndicators} aria-busy={indicatorsLoading}>
      {#each indicators as indicator (indicator.id)}
        <article class="indicator {indicator.tone}">
          <h2>{indicator.label}</h2>
          <p class="indicator-value">
            {#if indicator.value === null}
              <span class="indicator-reading" aria-label={text.unavailable}>— <span>{indicator.unit}</span></span>
            {:else}
              <span class="indicator-reading">{numberFormat.format(indicator.value)} <span>{indicator.unit}</span></span
              >
            {/if}
          </p>
        </article>
      {/each}
    </section>

    <section class="panel" aria-labelledby="daily-charts-title">
      <!-- <div class="panel-heading">
        <p class="eyebrow">{text.yourInstallation}</p>
        <h2 id="daily-charts-title">{text.dailyCharts}</h2>
        <p>{text.dailyChartsDescription}</p>
      </div> -->
      {#if current.chartError}
        <p class="chart-status" role="alert">{text.chartDataError} {text.databaseAdvice}</p>
      {:else if current.chartData.graphs.length === 0}
        <p class="chart-status" role="status">{text.chartConfigurationMissing}</p>
      {:else if current.chartData.sampleCount === 0}
        <p class="chart-status" role="status">{text.noReadings}</p>
      {:else}
        {#each current.chartData.graphs as graph (graph.id)}
          <section class="daily-chart-block" aria-label={`${text.dailyCharts}: ${graph.name}`}>
            <h3 class="daily-chart-title">{graph.name}</h3>
            {#if graph.series.length === 0}
              <p class="chart-status" role="status">{text.chartNoSeries}</p>
            {:else if !graph.series.some((item) => item.data.length > 0)}
              <p class="chart-status" role="status">{text.chartNoSeriesReadings}</p>
            {:else}
              <DailyChart
                series={graph.series}
                annotations={current.chartData.annotations}
                axisTitle={text.chartHour}
                accessibleLabel={`${text.chartAccessible}: ${graph.name}`}
                renderErrorText={text.chartRenderError}
                locale={data.language === "fr" ? "fr-FR" : "en-US"}
                sync={chartSync}
              />
            {/if}
          </section>
        {/each}
      {/if}
    </section>
  </section>
</main>
