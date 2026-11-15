import { editableRealtimeIndicators, legacySensorId, type RealtimeData } from './indicators/realtime.js';
import type { BoilerConfiguration } from './boiler-configurations.js';

export const boilerDraftContext = 'boiler-configuration-draft';

function numericValue(value: string): number {
	return Number(value.split(' ')[0]);
}

export class BoilerDraft {
	baseline = $state<BoilerConfiguration>({});
	values = $state<BoilerConfiguration>({});
	uncertain = $state(false);
	busy = $state(false);
	partialLoaded = $state(false);
	initialized = $state(false);

	get changes(): Record<string, number> {
		const changed: Record<string, number> = {};
		for (const [id, value] of Object.entries(this.values)) {
			const previous = this.baseline[id];
			if (previous !== undefined && numericValue(previous) !== numericValue(value)) {
				changed[id] = numericValue(previous);
			}
		}
		return changed;
	}

	get dirty(): boolean {
		return Object.keys(this.changes).length > 0;
	}

	get complete(): boolean {
		return editableRealtimeIndicators.every((indicator) => this.values[legacySensorId(indicator)] !== undefined);
	}

	initialize(data: RealtimeData | null): void {
		if (this.initialized || !data) return;
		const values: BoilerConfiguration = {};
		for (const indicator of editableRealtimeIndicators) {
			const reading = data.readings[indicator.id];
			if (reading && typeof reading.value === 'number' && Number.isFinite(reading.value)) {
				values[legacySensorId(indicator)] = `${reading.value}${reading.unit ? ` ${reading.unit}` : ''}`;
			}
		}
		this.baseline = { ...values };
		this.values = { ...values };
		this.initialized = true;
	}

	set(id: string, value: string): void {
		this.values = { ...this.values, [id]: value };
	}

	load(config: BoilerConfiguration): void {
		const available = Object.fromEntries(Object.entries(config).filter(([id]) => id in this.baseline));
		this.values = { ...this.baseline, ...available };
		this.partialLoaded = Object.keys(available).length !== editableRealtimeIndicators.length;
	}

	applied(): void {
		this.baseline = { ...this.values };
		this.partialLoaded = false;
	}
}
