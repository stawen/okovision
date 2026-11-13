import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	schedule: vi.fn(),
	enqueue: vi.fn(),
	stop: vi.fn(),
	stopTask: vi.fn()
}));
vi.mock('node-cron', () => ({ default: { schedule: mocks.schedule } }));
vi.mock('../../src/lib/server/jobs', () => ({
	getJobManager: async () => ({ enqueue: mocks.enqueue, stop: mocks.stop })
}));
vi.mock('../../src/lib/server/config', () => ({
	readOptionalCollectionConfig: async () => ({ timezone: 'Europe/Paris' })
}));

import { initializeJobs } from '../../src/lib/server/scheduler';

describe('ordonnanceur intégré', () => {
	it('initialise une seule fois la collecte et son calendrier local', async () => {
		const previousTerm = new Set(process.listeners('SIGTERM'));
		const previousInt = new Set(process.listeners('SIGINT'));
		const state = globalThis as typeof globalThis & { __okovisionScheduler?: Promise<void> };
		delete state.__okovisionScheduler;
		mocks.schedule.mockReturnValue({ stop: mocks.stopTask });
		mocks.enqueue.mockResolvedValue({});
		try {
			await initializeJobs(true);
			await initializeJobs(true);
			expect(mocks.schedule).toHaveBeenCalledOnce();
			expect(mocks.schedule).toHaveBeenCalledWith(
				'2 */2 * * *', expect.any(Function), { timezone: 'Europe/Paris', noOverlap: true }
			);
			expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith('collection', 'scheduler');
			await mocks.schedule.mock.calls[0][1]();
			expect(mocks.enqueue).toHaveBeenCalledTimes(2);
		} finally {
			for (const listener of process.listeners('SIGTERM')) {
				if (!previousTerm.has(listener)) process.removeListener('SIGTERM', listener as () => void);
			}
			for (const listener of process.listeners('SIGINT')) {
				if (!previousInt.has(listener)) process.removeListener('SIGINT', listener as () => void);
			}
			delete state.__okovisionScheduler;
		}
	});
});
