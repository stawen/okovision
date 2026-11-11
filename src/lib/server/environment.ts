let loaded = false;

export function loadServerEnvironment(): void {
	if (loaded) return;
	try {
		process.loadEnvFile('.env');
	} catch (error) {
		if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
	}
	loaded = true;
}
