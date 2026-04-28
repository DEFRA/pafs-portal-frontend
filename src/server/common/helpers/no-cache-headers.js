/**
 * Hapi onPreResponse extension that sets Cache-Control: no-store on all
 * HTML page responses.
 *
 * This prevents browsers from serving stale, cached pages after logout.
 * Without this header, pressing the browser Back button after logging out
 * shows the previous authenticated page from the browser's bfcache/disk cache
 * without making a new server request — bypassing all auth checks.
 *
 * Static assets under /public are excluded; they benefit from caching and
 * contain no sensitive data.
 *
 * Register this extension AFTER catchAll so it applies to error views too
 * (catchAll transforms Boom errors into view responses first, then this runs).
 *
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 */
export function noCacheHeaders(request, h) {
  const { response } = request

  if (
    request.path.startsWith('/public') ||
    request.path === '/favicon.ico' ||
    request.path === '/health' ||
    request.path.endsWith('/poll')
  ) {
    return h.continue
  }

  if (response.isBoom) {
    // Boom error not yet transformed by catchAll — set on output headers
    response.output.headers['Cache-Control'] = 'no-store'
  } else {
    // Normal view / redirect response
    response.header('Cache-Control', 'no-store')
  }

  return h.continue
}
