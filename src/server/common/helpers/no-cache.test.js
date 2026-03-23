import { describe, it, expect, vi } from 'vitest'
import { noCacheForViews } from './no-cache.js'

describe('noCacheForViews', () => {
  it('sets no-cache headers for view responses', () => {
    const header = vi.fn()
    const request = {
      response: {
        variety: 'view',
        header
      }
    }
    const h = { continue: Symbol('continue') }

    const result = noCacheForViews(request, h)

    expect(header).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    expect(header).toHaveBeenCalledWith('Pragma', 'no-cache')
    expect(header).toHaveBeenCalledWith('Expires', '0')
    expect(header).toHaveBeenCalledWith('Surrogate-Control', 'no-store')
    expect(result).toBe(h.continue)
  })

  it('does not set headers for non-view responses', () => {
    const header = vi.fn()
    const request = {
      response: {
        variety: 'plain',
        header
      }
    }
    const h = { continue: Symbol('continue') }

    const result = noCacheForViews(request, h)

    expect(header).not.toHaveBeenCalled()
    expect(result).toBe(h.continue)
  })
})
