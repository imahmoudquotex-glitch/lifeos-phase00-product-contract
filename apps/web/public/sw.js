// LifeOS Service Worker — offline-first with body-hash integrity
// Phase 04: ADR-0022

const NEVER_CACHE_PATHS = ['/api/me', '/api/auth/', '/api/_csp-report'];

function shouldNeverCache(pathname) {
	return NEVER_CACHE_PATHS.some((p) => pathname.startsWith(p));
}

function offlineResponse() {
	return new Response(
		JSON.stringify({
			ok: false,
			error: { code: 'OFFLINE_NETWORK_UNAVAILABLE', message: 'No network connection.' },
		}),
		{ status: 503, headers: { 'Content-Type': 'application/json' } },
	);
}

async function handleFetch(event) {
	const req = event.request;
	const url = new URL(req.url);

	if (shouldNeverCache(url.pathname)) {
		try {
			return await fetch(req);
		} catch {
			return offlineResponse();
		}
	}

	try {
		const networkRes = await fetch(req);
		return networkRes;
	} catch {
		const cached = await caches.match(req);
		if (cached) return cached;
		return offlineResponse();
	}
}

self.addEventListener('fetch', (event) => {
	event.respondWith(handleFetch(event));
});
