export function GET() {
	return Response.json(
		{ status: 'ok', database: 'not-configured' },
		{ headers: { 'cache-control': 'no-store' } }
	);
}
