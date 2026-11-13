<script lang="ts">
	import { onMount } from 'svelte';
	import type * as Highcharts from 'highcharts/highstock';
	import { uiMessages, numberLocale, type Language } from '#lib/ui/i18n.js';

	interface Props {
		kind: 'monthly' | 'season';
		language: Language;
		today: string;
		hasData: boolean;
		monthlyData: {
			max: (number | null)[];
			min: (number | null)[];
			consumption: (number | null)[];
			dju: (number | null)[];
			cycles: (number | null)[];
		} | null;
		seasonalData: {
			months: {
				year: number;
				month: number;
				max: number | null;
				min: number | null;
				consumption: number | null;
				dju: number | null;
				cycles: number | null;
				ecs: number | null;
			}[];
		} | null;
	}

	const temperatureScale = { min: -10, max: 50, tickInterval: 10 };
	const consumptionScale = { min: 0, max: 80, tickInterval: 10 };
	const cyclesScale = { min: 0, max: 60, tickInterval: 10 };
	const seasonTemperatureScale = { max: 50, tickInterval: 10 };
	const seasonConsumptionScale = { max: 2000, tickInterval: 500 };
	const seasonCyclesScale = { max: 400, tickInterval: 100 };

	let { kind, language, today, hasData, monthlyData, seasonalData }: Props = $props();
	let container: HTMLDivElement | undefined = $state();
	let renderError = $state(false);
	let instance: Highcharts.Chart | undefined = $state();
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
	let hasOutOfRangeValues = $derived(
		kind === 'monthly'
			? monthlyData !== null && [
					{ values: monthlyData.max, ...temperatureScale },
					{ values: monthlyData.min, ...temperatureScale },
					{ values: monthlyData.consumption, ...consumptionScale },
					{ values: monthlyData.dju, ...consumptionScale },
					{ values: monthlyData.cycles, ...cyclesScale }
				].some(({ values, min, max }) => values.some((value) => value !== null && (value < min || value > max)))
			: chartValues().some((values, index) => {
					const max = [
						seasonTemperatureScale.max, seasonTemperatureScale.max,
						seasonConsumptionScale.max, seasonConsumptionScale.max,
						seasonCyclesScale.max, seasonConsumptionScale.max
					][index];
					return values.some((value) => value !== null && value > max);
				})
	);

	function chartValues() {
		if (kind === 'monthly') {
			return [
				monthlyData?.max ?? [],
				monthlyData?.min ?? [],
				monthlyData?.consumption ?? [],
				monthlyData?.dju ?? [],
				monthlyData?.cycles ?? []
			];
		}
		const months = seasonalData?.months ?? [];
		const points = (key: 'max' | 'min' | 'consumption' | 'dju' | 'cycles' | 'ecs') =>
			months.map((month) =>
				`${month.year}-${String(month.month).padStart(2, '0')}` === today.slice(0, 7)
					? null
					: month[key]
			);
		return [
			points('max'),
			points('min'),
			points('consumption'),
			points('dju'),
			points('cycles'),
			points('ecs')
		];
	}

	$effect(() => {
		const chart = instance;
		const values = chartValues();
		if (!chart) return;
		const categories = kind === 'monthly'
			? Array.from({ length: monthlyData?.max.length ?? 0 }, (_, index) => String(index + 1).padStart(2, '0'))
			: (seasonalData?.months ?? []).map((month) =>
				new Intl.DateTimeFormat(numberLocale(language), { month: 'long', timeZone: 'UTC' })
					.format(new Date(Date.UTC(month.year, month.month - 1, 15)))
			);
		chart.xAxis[0]?.setCategories(categories, false);
		values.forEach((value, index) => chart.series[index]?.setData(value.slice(), false, false, false));
		chart.redraw(false);
	});

	onMount(() => {
		let active = true;

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
				{
					title: {
						text: text.historyChartTemperature,
						style: { color: '#c63232' }
					},
					...(kind === 'monthly' ? temperatureScale : seasonTemperatureScale)
				},
				{
					gridLineWidth: 0,
					title: {
						text: text.historyChartKgDju,
						style: { color: '#245bbb' }
					},
					...(kind === 'monthly' ? consumptionScale : seasonConsumptionScale),
					opposite: true
				},
				{
					gridLineWidth: 0,
					title: {
						text: text.historyChartCycles,
						style: { color: '#936300' }
					},
					...(kind === 'monthly' ? cyclesScale : seasonCyclesScale),
					opposite: true
				}
			];

			const options: Highcharts.Options = {
				chart: { type: 'spline', height: kind === 'monthly' ? 450 : 390, spacingBottom: 22, alignTicks: false },
				title: { text: '' },
				xAxis:
					kind === 'monthly'
						? {
								categories: [],
								title: { text: text.historyChartDay },
								accessibility: { rangeDescription: '' }
							}
						: {
								categories: [],
								title: { text: text.historyChartMonth },
								labels: { style: { textOverflow: 'none' } },
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
			instance = undefined;
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
	{#if !hasData}
		<p class="chart-message" role="status">{text.historyChartUnavailable}</p>
	{/if}
	{#if hasOutOfRangeValues}
		<p class="chart-message" role="status">{text.historyChartOutsideRange}</p>
	{/if}
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
