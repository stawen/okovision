<script lang="ts">
	import { onMount } from 'svelte';
	import type * as Highcharts from 'highcharts/highstock';
	import { uiMessages, numberLocale, type Language } from '#lib/i18n.js';

	interface Props {
		kind: 'monthly' | 'season';
		language: Language;
	}

	let { kind, language }: Props = $props();
	let container: HTMLDivElement | undefined = $state();
	let renderError = $state(false);
	let text = $derived(uiMessages(language));
	let seriesNames = $derived(
		kind === 'monthly'
			? [
					{ name: text.maxOutside, color: '#e65050', shape: 'line' },
					{ name: text.minOutside, color: '#3972e8', shape: 'line' },
					{ name: text.consumption, color: '#75aee7', shape: 'box' },
					{ name: text.historyDegreeDays, color: '#858585', shape: 'line' },
					{ name: text.historyBurnerCycles, color: '#ecb962', shape: 'box' }
				]
			: [
					{ name: text.maxOutside, color: '#e65050', shape: 'line' },
					{ name: text.minOutside, color: '#3972e8', shape: 'line' },
					{ name: text.consumption, color: '#75aee7', shape: 'box' },
					{ name: text.historyDegreeDays, color: '#858585', shape: 'line' },
					{ name: text.historyBurnerCycles, color: '#ecb962', shape: 'box' },
					{ name: text.hotWaterConsumption, color: '#389448', shape: 'line' }
				]
	);
	let accessibleLabel = $derived(kind === 'monthly' ? text.historyMonthlyTitle : text.historySeasonTitle);

	onMount(() => {
		let active = true;
		let instance: Highcharts.Chart | undefined;

		void (async () => {
			const { default: library } = await import('highcharts/highstock');
			await import('highcharts/modules/accessibility');
			if (!active || !container) return;

			const chartSeries: Highcharts.SeriesOptionsType[] =
				kind === 'monthly'
					? [
							{ type: 'spline', name: text.maxOutside, color: '#e65050', data: [], zIndex: 3, marker: { enabled: true } },
							{ type: 'spline', name: text.minOutside, color: '#3972e8', data: [], zIndex: 2, marker: { enabled: true } },
							{ type: 'column', name: text.consumption, color: '#75aee7', data: [], yAxis: 1, zIndex: 1 },
							{ type: 'spline', name: text.historyDegreeDays, color: '#858585', data: [], yAxis: 1, zIndex: 4, marker: { enabled: true } },
							{ type: 'column', name: text.historyBurnerCycles, color: '#ecb962', data: [], yAxis: 2 }
						]
					: [
							{ type: 'spline', name: text.maxOutside, color: '#e65050', data: [], zIndex: 3, marker: { enabled: true } },
							{ type: 'spline', name: text.minOutside, color: '#3972e8', data: [], zIndex: 2, marker: { enabled: true } },
							{ type: 'column', name: text.consumption, color: '#75aee7', data: [], yAxis: 1, zIndex: 1 },
							{ type: 'spline', name: text.historyDegreeDays, color: '#858585', data: [], yAxis: 1, zIndex: 4, marker: { enabled: true } },
							{ type: 'column', name: text.historyBurnerCycles, color: '#ecb962', data: [], yAxis: 2 },
							{ type: 'spline', name: text.hotWaterConsumption, color: '#389448', data: [], yAxis: 1, zIndex: 1, marker: { enabled: true } }
						];

			const axes: Highcharts.YAxisOptions[] = [
				{ title: { text: text.historyChartTemperature }, ...(kind === 'monthly' ? { min: -5, max: 40 } : {}) },
				{
					gridLineWidth: 0,
					title: { text: text.historyChartKgDju },
					min: kind === 'monthly' ? 0 : undefined,
					max: kind === 'monthly' ? 60 : undefined,
					opposite: true
				},
				{
					gridLineWidth: 0,
					title: { text: text.historyChartCycles },
					min: kind === 'monthly' ? 0 : undefined,
					max: kind === 'monthly' ? 50 : undefined,
					opposite: true
				}
			];

			const options: Highcharts.Options = {
				chart: { type: 'spline', height: kind === 'monthly' ? 450 : 390, spacingBottom: 22 },
				title: { text: '' },
				xAxis:
					kind === 'monthly'
						? {
								categories: Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0')),
								max: 30,
								title: { text: text.historyChartDay },
								accessibility: { rangeDescription: '' }
							}
						: {
								type: 'datetime',
								dateTimeLabelFormats: { month: '%B' },
								title: { text: text.historyChartMonth },
								accessibility: { rangeDescription: '' }
							},
				yAxis: axes,
				plotOptions: {
					line: { marker: { enabled: true } },
					column: { pointPadding: 0, borderWidth: 0.2 }
				},
				legend: { enabled: false },
				tooltip: { shared: true, crosshairs: true },
				credits: { enabled: false },
				lang: {
					locale: numberLocale(language),
					accessibility: { chartContainerLabel: accessibleLabel }
				},
				accessibility: { description: accessibleLabel },
				series: chartSeries
			};

			try {
				instance = library.chart(container, options);
				renderError = false;
			} catch (cause) {
				console.error('Unable to render a historical Highcharts chart.', cause);
				renderError = true;
			}
		})().catch((cause: unknown) => {
			console.error('Unable to load Highcharts for the historical view.', cause);
			if (active) renderError = true;
		});

		return () => {
			active = false;
			instance?.destroy();
		};
	});
</script>

<figure class="historical-chart">
	<div class="chart-area">
		<div bind:this={container} role="region" aria-label={accessibleLabel}></div>
		{#if renderError}
			<p class="chart-message error" role="alert">{text.chartRenderError}</p>
		{/if}
	</div>
	<p class="chart-message" role="status">{text.historyChartUnavailable}</p>
	<figcaption class="chart-legend">
		{#each seriesNames as series (series.name)}
			<span class="legend-item">
				<span
					class="legend-symbol {series.shape}"
					style={`--series-color: ${series.color}`}
					aria-hidden="true"
				></span>
				{series.name}
			</span>
		{/each}
	</figcaption>
</figure>

<style>
	.historical-chart { margin: 0; }
	.chart-area { position: relative; min-height: 300px; }
	.chart-area > div { min-height: 300px; }
	.chart-message { padding: 0.65rem 1rem; color: #78879a; font-size: 0.76rem; text-align: center; }
	.chart-message.error { position: absolute; inset: 42% 0 auto; color: #a63d38; }
	.chart-legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem 1.1rem;
		padding: 0.7rem 1rem 0.9rem;
		border-top: 1px solid #edf1f5;
		color: #3d4652;
		font-size: 0.73rem;
		font-weight: 600;
	}
	.legend-item { display: inline-flex; align-items: center; gap: 0.4rem; }
	.legend-symbol { flex: 0 0 0.75rem; width: 0.75rem; height: 0.75rem; }
	.legend-symbol.line { height: 2px; background: var(--series-color); }
	.legend-symbol.box { border-radius: 1px; background: var(--series-color); }
	@media (max-width: 640px) {
		.chart-area, .chart-area > div { min-height: 280px; }
		.chart-message { padding-inline: 0.7rem; font-size: 0.71rem; }
		.chart-legend { justify-content: flex-start; gap: 0.5rem 0.8rem; padding-inline: 0.7rem; font-size: 0.68rem; }
	}
</style>
