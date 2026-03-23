/**
 * Prevents browser/proxy caching for server-rendered pages.
 * This avoids stale form values when users navigate with browser back/forward.
 */
export function noCacheForViews(request, h) {
  const { response } = request

  if (response?.variety !== 'view') {
    return h.continue
  }

  response.header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  )
  response.header('Pragma', 'no-cache')
  response.header('Expires', '0')
  response.header('Surrogate-Control', 'no-store')

  return h.continue
}
