export const boilerCsvDirectory = '/logfiles/pelletronic/';

export function normalizeBoilerAddress(rawAddress: unknown): string | null {
	if (typeof rawAddress !== 'string' || !rawAddress.trim() || /[/\\?#@]/.test(rawAddress)) return null;
	let address: URL;
	try {
		address = new URL(`http://${rawAddress.trim()}`);
	} catch (cause) {
		if (cause instanceof TypeError) return null;
		throw cause;
	}
	if (!address.hostname || address.username || address.password || address.pathname !== '/'
		|| address.search || address.hash) return null;
	return address.origin;
}

export async function testBoilerConnection(
	rawAddress: string,
	fetcher: typeof fetch = fetch
): Promise<{ status: 'invalid' | 'unreachable' } | { status: 'reachable'; url: string }> {
	const origin = normalizeBoilerAddress(rawAddress);
	if (!origin) return { status: 'invalid' };
	const url = new URL(boilerCsvDirectory, origin).href;
	try {
		const response = await fetcher(url, {
			mode: 'no-cors',
			credentials: 'omit',
			redirect: 'follow',
			cache: 'no-store',
			signal: AbortSignal.timeout(5000)
		});
		if (response.type !== 'opaque' && !response.ok) return { status: 'unreachable' };
		return { status: 'reachable', url };
	} catch {
		return { status: 'unreachable' };
	}
}
