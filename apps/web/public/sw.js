// LifeOS Service Worker — offline-first with body-hash integrity
// Phase 04: ADR-0022
// RISK-008: Never cache authenticated API routes or routes that set cookies.

const NEVER_CACHE_PATHS = [
  '/api/v1/auth/',   // Phase 05 auth routes — the REAL path
  '/api/auth/',      // legacy compat prefix
  '/api/v1/me',
  '/api/me',
  '/api/_csp-report',
];

function shouldNeverCache(pathname, method, responseHeaders) {
  // Never cache any auth-related path
  if (NEVER_CACHE_PATHS.some((p) => pathname.startsWith(p))) return true;
  // Never cache any response that sets a cookie (session cookie protection)
  if (responseHeaders && responseHeaders.has('Set-Cookie')) return true;
  // Never cache mutating methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;
  return false;
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

	if (shouldNeverCache(url.pathname, req.method, null)) {
		try {
			return await fetch(req);
		} catch {
			return offlineResponse();
		}
	}

	try {
		const networkRes = await fetch(req);
		// Also check response headers at fetch time
		if (shouldNeverCache(url.pathname, req.method, networkRes.headers)) {
			return networkRes;
		}
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
