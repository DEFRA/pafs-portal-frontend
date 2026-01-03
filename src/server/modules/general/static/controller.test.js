import { describe, it, expect, beforeEach, vi } from 'vitest'

import { staticPageController } from './controller.js'
import { config } from '../../../../config/config.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { GENERAL_VIEWS } from '../../../common/constants/common.js'

vi.mock('../../../../config/config.js', () => ({ config: { get: vi.fn() } }))
vi.mock('../../../common/constants/status-codes.js', () => ({
  statusCodes: { notFound: 404 }
}))

describe('StaticPageController - common', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 404 for unknown path', () => {
    const request = { path: '/unknown-path', t: vi.fn() }
    const h = {
      view: vi.fn(),
      response: vi.fn((message) => ({
        code: (status) => ({ message, status })
      }))
    }

    const result = staticPageController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith('Page not found')
    expect(result).toEqual({
      message: 'Page not found',
      status: statusCodes.notFound
    })
    expect(h.view).not.toHaveBeenCalled()
  })
})

describe('StaticPageController - privacy page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders privacy page with correct template and viewData', () => {
    const lastUpdatedDate = '2025-01-01'
    config.get.mockReturnValue(lastUpdatedDate)

    const request = {
      path: ROUTES.GENERAL.STATIC_PAGES.PRIVACY_NOTICE,
      t: vi.fn((key) => `translated_${key}`)
    }

    const h = {
      view: vi.fn((template, data) => ({ template, data })),
      response: vi.fn()
    }

    const result = staticPageController.handler(request, h)

    expect(h.view).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith(GENERAL_VIEWS.STATIC_PAGES.PRIVACY, {
      pageTitle: 'translated_static-pages.privacy.title',
      heading: 'translated_static-pages.privacy.heading',
      privacyLastUpdatedDate: lastUpdatedDate,
      localeNamespace: 'static-pages.privacy'
    })
    expect(config.get).toHaveBeenCalledWith('privacyNotice.lastUpdatedDate')
    expect(result).toEqual({
      template: GENERAL_VIEWS.STATIC_PAGES.PRIVACY,
      data: {
        pageTitle: 'translated_static-pages.privacy.title',
        heading: 'translated_static-pages.privacy.heading',
        privacyLastUpdatedDate: lastUpdatedDate,
        localeNamespace: 'static-pages.privacy'
      }
    })
  })
})
