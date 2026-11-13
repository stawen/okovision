<script lang="ts">
  import { onMount } from "svelte";
  import type * as Highcharts from "highcharts/highstock";
  import type { DailyChartSync } from "#lib/charts/chart-sync.js";

  interface ChartSeries {
    name: string;
    data: [number, number][];
  }

  interface ChartAnnotation {
    timestamp: number;
    description: string;
  }

  interface Props {
    series: ChartSeries[];
    annotations: ChartAnnotation[];
    axisTitle: string;
    accessibleLabel: string;
    renderErrorText: string;
    locale: string;
    sync: DailyChartSync;
  }

  let { series, annotations, axisTitle, accessibleLabel, renderErrorText, locale, sync }: Props = $props();
  let container: HTMLDivElement | undefined = $state();
  let highcharts: typeof import("highcharts/highstock") | undefined = $state();
  let renderError = $state(false);

  onMount(() => {
    let active = true;
    void (async () => {
      const { default: library } = await import("highcharts/highstock");
      await import("highcharts/modules/accessibility");
      if (active) highcharts = library;
    })().catch((cause: unknown) => {
      console.error("Unable to load Highcharts for the daily view.", cause);
      if (active) renderError = true;
    });

    return () => {
      active = false;
    };
  });

  $effect(() => {
    const library = highcharts;
    const target = container;
    if (!library || !target) return;
    const coordinator = sync;

    const chartSeries: Highcharts.SeriesOptionsType[] = series.map((item) => ({
      type: "spline",
      name: item.name,
      data: item.data,
      marker: { enabled: false }
    }));
    if (annotations.length > 0) {
      chartSeries.push({
        type: "flags",
        name: "config",
        color: "#333333",
        shape: "circlepin",
        y: 0,
        showInLegend: false,
        data: annotations.map((annotation) => ({
          x: annotation.timestamp,
          title: "M",
          text: annotation.description
        }))
      });
    }

    const options: Highcharts.Options = {
      chart: {
        type: "spline",
        zooming: { type: "x", resetButton: { theme: { style: { display: "none" } } } },
        panning: { enabled: true, type: "x" },
        panKey: "shift"
      },
      title: { text: "" },
      colors: ["#75b7f4", "#596579", "#65cf68", "#ff9a4c"],
      xAxis: {
        type: "datetime",
        minRange: 0,
        events: {
          afterSetExtremes(event) {
            coordinator.afterSetExtremes(this, event);
          }
        },
        title: { text: axisTitle },
        plotLines: annotations.map((annotation) => ({
          value: annotation.timestamp,
          color: "#d95c55",
          dashStyle: "LongDash",
          width: 2,
          zIndex: 3
        }))
      },
      yAxis: { title: { text: "" } },
      plotOptions: { spline: { marker: { enabled: false } } },
      tooltip: { shared: true, crosshairs: true },
      legend: { enabled: true },
      credits: { enabled: false },
      lang: { locale },
      accessibility: { description: accessibleLabel },
      series: chartSeries
    };

    try {
      const instance = library.chart(target, options);
      const unregister = coordinator.register(instance.xAxis[0]);
      renderError = false;
      return () => {
        unregister();
        instance.destroy();
      };
    } catch (cause) {
      console.error("Unable to render a daily Highcharts chart.", cause);
      renderError = true;
    }
  });
</script>

<div class="chart-container">
  <div bind:this={container} role="region" aria-label={accessibleLabel}></div>
  {#if renderError}
    <p class="chart-render-error" role="alert">{renderErrorText}</p>
  {/if}
</div>

<style>
  .chart-container { min-width: 0; min-height: 350px; }
  .chart-container > div { width: 100%; min-height: 350px; }
  .chart-render-error { padding: 0.75rem 1rem; color: #a63d38; text-align: center; }
</style>
