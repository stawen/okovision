export interface ChartRange {
	min: number;
	max: number;
}

export interface DailyIndicators {
	sampleCount: number;
	conso: number | null;
	ecs: number | null;
	max: number | null;
	min: number | null;
	missingSensors: boolean;
}

export function isChartRange(range: ChartRange): boolean {
	return Number.isFinite(range.min) && Number.isFinite(range.max)
		&& range.min >= 0 && range.max <= 8640000000000000 && range.min < range.max;
}

export function isDailyIndicators(value: unknown): value is DailyIndicators {
	if (!value || typeof value !== 'object') return false;
	return 'sampleCount' in value && Number.isSafeInteger(value.sampleCount)
		&& typeof value.sampleCount === 'number' && value.sampleCount >= 0
		&& 'missingSensors' in value && typeof value.missingSensors === 'boolean'
		&& ['conso', 'ecs', 'max', 'min'].every((key) => {
			const reading: unknown = Reflect.get(value, key);
			return reading === null || (typeof reading === 'number' && Number.isFinite(reading));
		});
}
