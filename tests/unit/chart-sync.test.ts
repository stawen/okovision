import { describe, expect, it, vi } from 'vitest';
import { createDailyChartSync } from '../../src/lib/charts/chart-sync';

function axis() {
	return {
		setExtremes: vi.fn(),
		getExtremes: vi.fn((): { userMin?: number; userMax?: number } => ({
			userMin: 1000, userMax: 2000
		}))
	};
}

describe('synchronisation des graphiques journaliers', () => {
	it('propage zoom et panoramique sans réentrance ni requête au chargement', () => {
		const onChange = vi.fn();
		const sync = createDailyChartSync(onChange);
		const first = axis();
		const second = axis();
		sync.register(first);
		sync.register(second);
		sync.afterSetExtremes(first, { min: 1000, max: 2000, trigger: '' });
		expect(onChange).not.toHaveBeenCalled();

		second.setExtremes.mockImplementation((min, max, _redraw, _animation, event) => {
			sync.afterSetExtremes(second, { min, max, trigger: event.trigger });
		});
		sync.afterSetExtremes(first, { min: 1000, max: 2000, trigger: 'zoom' });
		expect(second.setExtremes).toHaveBeenLastCalledWith(1000, 2000, true, false, { trigger: 'daily-chart-sync' });
		expect(first.setExtremes).not.toHaveBeenCalled();
		expect(onChange).toHaveBeenCalledExactlyOnceWith({ min: 1000, max: 2000 });

		sync.afterSetExtremes(second, { min: 2000, max: 3000, trigger: 'pan' });
		expect(first.setExtremes).toHaveBeenLastCalledWith(2000, 3000, true, false, { trigger: 'daily-chart-sync' });
		expect(onChange).toHaveBeenLastCalledWith({ min: 2000, max: 3000 });
		expect(onChange).toHaveBeenCalledTimes(2);
	});

	it('réinitialise tous les axes et remet la plage à zéro après un reset natif', () => {
		const onChange = vi.fn();
		const sync = createDailyChartSync(onChange);
		const first = axis();
		const second = axis();
		sync.register(first);
		sync.register(second);
		sync.afterSetExtremes(first, { min: 1000, max: 2000, trigger: 'zoom' });
		first.getExtremes.mockReturnValue({});
		sync.afterSetExtremes(first, { min: 0, max: 3000, trigger: 'zoom' });
		expect(second.setExtremes).toHaveBeenLastCalledWith(undefined, undefined, true, false, { trigger: 'daily-chart-sync' });
		expect(onChange).toHaveBeenLastCalledWith(null);

		sync.reset();
		expect(first.setExtremes).toHaveBeenLastCalledWith(undefined, undefined, true, false, { trigger: 'daily-chart-sync' });
		expect(onChange).toHaveBeenLastCalledWith(null);
	});

	it('applique le zoom aux graphiques chargés plus tard et retire les axes détruits', () => {
		const sync = createDailyChartSync(vi.fn());
		const first = axis();
		const unregister = sync.register(first);
		sync.afterSetExtremes(first, { min: 1000, max: 2000, trigger: 'zoom' });
		const second = axis();
		sync.register(second);
		expect(second.setExtremes).toHaveBeenCalledWith(1000, 2000, true, false, { trigger: 'daily-chart-sync' });
		unregister();
		sync.reset();
		expect(first.setExtremes).not.toHaveBeenCalled();
	});
});
