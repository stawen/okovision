import type { Axis, AxisSetExtremesEventObject } from 'highcharts';
import { isChartRange, type ChartRange } from '../indicators/daily.ts';

type ChartAxis = {
	setExtremes: Axis['setExtremes'];
	getExtremes: () => Pick<ReturnType<Axis['getExtremes']>, 'userMin' | 'userMax'>;
};
const syncTrigger = 'daily-chart-sync';

/** Keeps all daily charts on the same user-selected time range without reprocessing its own updates. */
export function createDailyChartSync(onChange: (range: ChartRange | null) => void) {
	const axes = new Set<ChartAxis>();
	let range: ChartRange | null = null;

	function apply(axis: ChartAxis) {
		axis.setExtremes(range?.min, range?.max, true, false, { trigger: syncTrigger });
	}

	return {
		register(axis: ChartAxis) {
			axes.add(axis);
			if (range) apply(axis);
			return () => { axes.delete(axis); };
		},
		afterSetExtremes(axis: ChartAxis, event: Pick<AxisSetExtremesEventObject, 'min' | 'max' | 'trigger'>) {
			if (!event.trigger || event.trigger === syncTrigger) return;
			const { userMin, userMax } = axis.getExtremes();
			const next = userMin === undefined && userMax === undefined
				? null : { min: event.min, max: event.max };
			if (next && !isChartRange(next)) throw new Error('Invalid chart range');
			if (range?.min === next?.min && range?.max === next?.max) return;
			range = next;
			for (const other of axes) {
				if (other !== axis) apply(other);
			}
			onChange(range);
		},
		reset() {
			range = null;
			for (const axis of axes) apply(axis);
			onChange(null);
		}
	};
}

export type DailyChartSync = ReturnType<typeof createDailyChartSync>;
