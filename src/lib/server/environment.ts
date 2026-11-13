let loaded = false;

/** Loads an optional local .env file once; errors other than a missing file are surfaced. */
export function loadServerEnvironment(): void {
	if (loaded) return;
	try {
		process.loadEnvFile('.env');
	} catch (error) {
		if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
	}
	loaded = true;
}
