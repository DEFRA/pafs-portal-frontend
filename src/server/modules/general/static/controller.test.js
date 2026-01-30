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

describe('StaticPageController - accessibility page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders accessibility page with correct template and viewData', () => {
    const lastUpdatedDate = '2026-06-06'
    config.get.mockReturnValue(lastUpdatedDate)

    const request = {
      path: ROUTES.GENERAL.STATIC_PAGES.ACCESSIBILITY,
      t: vi.fn((key) => `translated_${key}`)
    }

    const h = {
      view: vi.fn((template, data) => ({ template, data })),
      response: vi.fn()
    }

    const result = staticPageController.handler(request, h)

    expect(h.view).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith(
      GENERAL_VIEWS.STATIC_PAGES.ACCESSIBILITY,
      {
        pageTitle: 'translated_static-pages.accessibility.title',
        heading: 'translated_static-pages.accessibility.heading',
        privacyLastUpdatedDate: lastUpdatedDate,
        localeNamespace: 'static-pages.accessibility'
      }
    )
    expect(config.get).toHaveBeenCalledWith('privacyNotice.lastUpdatedDate')
    expect(result).toEqual({
      template: GENERAL_VIEWS.STATIC_PAGES.ACCESSIBILITY,
      data: {
        pageTitle: 'translated_static-pages.accessibility.title',
        heading: 'translated_static-pages.accessibility.heading',
        privacyLastUpdatedDate: lastUpdatedDate,
        localeNamespace: 'static-pages.accessibility'
      }
    })
  })
})
describe('StaticPageController - cookies page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders cookies page with correct template and viewData', () => {
    const lastUpdatedDate = '2026-01-05'
    config.get.mockReturnValue(lastUpdatedDate)

    const request = {
      path: ROUTES.GENERAL.STATIC_PAGES.COOKIES,
      t: vi.fn((key) => `translated_${key}`)
    }

    const h = {
      view: vi.fn((template, data) => ({ template, data })),
      response: vi.fn()
    }

    const result = staticPageController.handler(request, h)

    expect(h.view).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith(GENERAL_VIEWS.STATIC_PAGES.COOKIES, {
      pageTitle: 'translated_static-pages.cookies.title',
      heading: 'translated_static-pages.cookies.heading',
      privacyLastUpdatedDate: lastUpdatedDate,
      localeNamespace: 'static-pages.cookies'
    })
    expect(config.get).toHaveBeenCalledWith('privacyNotice.lastUpdatedDate')
    expect(result).toEqual({
      template: GENERAL_VIEWS.STATIC_PAGES.COOKIES,
      data: {
        pageTitle: 'translated_static-pages.cookies.title',
        heading: 'translated_static-pages.cookies.heading',
        privacyLastUpdatedDate: lastUpdatedDate,
        localeNamespace: 'static-pages.cookies'
      }
    })
  })
})

describe('StaticPageController - cookie settings page (GET)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with saved flag and existing consent', () => {
    config.get.mockImplementation((key) => {
      if (key === 'privacyNotice.lastUpdatedDate') return '2026-02-02'
      return null
    })

    const request = {
      path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS,
      state: {
        cookies_policy: JSON.stringify({
          analytics: 'yes'
        })
      },
      query: { saved: 'true' },
      t: vi.fn((key) => `translated_${key}`)
    }

    const h = {
      view: vi.fn((template, data) => ({ template, data })),
      response: vi.fn()
    }

    const result = staticPageController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      GENERAL_VIEWS.STATIC_PAGES.COOKIE_SETTINGS,
      expect.objectContaining({
        pageTitle: 'translated_static-pages.cookie_settings.title',
        heading: 'translated_static-pages.cookie_settings.heading',
        localeNamespace: 'static-pages.cookie_settings',
        analyticsConsent: 'yes',
        savedSuccessfully: true
      })
    )
    expect(result.template).toBe(GENERAL_VIEWS.STATIC_PAGES.COOKIE_SETTINGS)
  })

  it('defaults consent to "no" and saved flag to false', () => {
    config.get.mockReturnValue('2026-02-03')

    const request = {
      path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS,
      state: {},
      query: {},
      t: vi.fn((key) => `translated_${key}`)
    }

    const h = {
      view: vi.fn((template, data) => ({ template, data })),
      response: vi.fn()
    }

    staticPageController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      GENERAL_VIEWS.STATIC_PAGES.COOKIE_SETTINGS,
      expect.objectContaining({
        analyticsConsent: 'no',
        savedSuccessfully: false
      })
    )
  })
})

describe('StaticPageController - cookie settings page (POST)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets analytics consent cookie and preferences cookie then redirects with saved flag', () => {
    config.get.mockImplementation((key) => {
      if (key === 'cookie.preferences.ttl') return 1000
      if (key === 'session.cookie.secure') return true
      if (key === 'cookie.policy.version') return 1
      return null
    })

    const request = {
      path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS,
      payload: { analyticsConsent: 'yes' }
    }

    const stateSpy = vi.fn().mockReturnThis()
    const redirectSpy = vi.fn(() => ({ state: stateSpy }))

    const h = {
      redirect: redirectSpy
    }

    const response = staticPageController.postHandler(request, h)

    expect(redirectSpy).toHaveBeenCalledWith(
      `${ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS}?saved=true`
    )

    expect(stateSpy).toHaveBeenCalledWith(
      'cookies_policy',
      JSON.stringify({ analytics: 'yes', policyVersion: 1 }),
      expect.objectContaining({
        ttl: 1000,
        isSecure: true,
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
    )

    expect(stateSpy).toHaveBeenCalledWith(
      'cookies_preferences_set',
      'true',
      expect.objectContaining({
        ttl: 1000,
        isSecure: true,
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
    )

    expect(response).toBeDefined()
  })

  it('defaults analytics consent to "no" when payload missing or not yes', () => {
    config.get.mockImplementation((key) => {
      if (key === 'cookie.preferences.ttl') return 500
      if (key === 'session.cookie.secure') return false
      if (key === 'cookie.policy.version') return 1
      return null
    })

    const request = {
      path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS,
      payload: {}
    }

    const stateSpy = vi.fn().mockReturnThis()
    const redirectSpy = vi.fn(() => ({ state: stateSpy }))
    const h = { redirect: redirectSpy }

    staticPageController.postHandler(request, h)

    expect(stateSpy).toHaveBeenCalledWith(
      'cookies_policy',
      JSON.stringify({ analytics: 'no', policyVersion: 1 }),
      expect.any(Object)
    )
  })
})

describe('StaticPageController - cookie banner accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts analytics cookies and sets show_cookie_confirmation', () => {
    config.get.mockImplementation((key) => {
      if (key === 'cookie.preferences.ttl') return 31536000
      if (key === 'session.cookie.secure') return true
      if (key === 'cookie.policy.version') return 1
      return null
    })

    const request = {
      headers: { referer: '/home' }
    }

    const stateSpy = vi.fn().mockReturnThis()
    const unstateSpy = vi.fn().mockReturnThis()
    const redirectSpy = vi.fn(() => ({
      state: stateSpy,
      unstate: unstateSpy
    }))

    const h = {
      redirect: redirectSpy
    }

    const response = staticPageController.acceptCookiesHandler(request, h)

    expect(redirectSpy).toHaveBeenCalledWith('/home')
    expect(stateSpy).toHaveBeenCalledWith(
      'cookies_policy',
      JSON.stringify({ analytics: 'yes', policyVersion: 1 }),
      expect.objectContaining({
        isSecure: true,
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
    )
    expect(stateSpy).toHaveBeenCalledWith(
      'show_cookie_confirmation',
      'true',
      expect.objectContaining({
        isSameSite: 'Lax'
      })
    )
    expect(response).toBeDefined()
  })

  it('accepts cookies and defaults to / when no referer', () => {
    config.get.mockImplementation((key) => {
      if (key === 'cookie.preferences.ttl') return 31536000
      if (key === 'session.cookie.secure') return false
      return null
    })

    const request = {
      headers: {}
    }

    const stateSpy = vi.fn().mockReturnThis()
    const unstateSpy = vi.fn().mockReturnThis()
    const redirectSpy = vi.fn(() => ({
      state: stateSpy,
      unstate: unstateSpy
    }))

    const h = {
      redirect: redirectSpy
    }

    staticPageController.acceptCookiesHandler(request, h)

    expect(redirectSpy).toHaveBeenCalledWith('/')
  })
})

describe('StaticPageController - cookie banner reject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects analytics cookies and sets show_cookie_confirmation', () => {
    config.get.mockImplementation((key) => {
      if (key === 'cookie.preferences.ttl') return 31536000
      if (key === 'session.cookie.secure') return true
      if (key === 'cookie.policy.version') return 1
      return null
    })

    const request = {
      headers: { referer: '/home' }
    }

    const stateSpy = vi.fn().mockReturnThis()
    const unstateSpy = vi.fn().mockReturnThis()
    const redirectSpy = vi.fn(() => ({
      state: stateSpy,
      unstate: unstateSpy
    }))

    const h = {
      redirect: redirectSpy
    }

    const response = staticPageController.rejectCookiesHandler(request, h)

    expect(redirectSpy).toHaveBeenCalledWith('/home')
    expect(stateSpy).toHaveBeenCalledWith(
      'cookies_policy',
      JSON.stringify({ analytics: 'no', policyVersion: 1 }),
      expect.objectContaining({
        isSecure: true,
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
    )
    expect(response).toBeDefined()
  })
})

describe('StaticPageController - hide cookie message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears show_cookie_confirmation cookie', () => {
    const request = {
      headers: { referer: '/home' }
    }

    const unstateSpy = vi.fn().mockReturnThis()
    const redirectSpy = vi.fn(() => ({
      unstate: unstateSpy
    }))

    const h = {
      redirect: redirectSpy
    }

    const response = staticPageController.hideMessageHandler(request, h)

    expect(redirectSpy).toHaveBeenCalledWith('/home')
    expect(unstateSpy).toHaveBeenCalledWith('show_cookie_confirmation', {
      path: '/'
    })
    expect(response).toBeDefined()
  })

  it('hides message and defaults to / when no referer', () => {
    const request = {
      headers: {}
    }

    const unstateSpy = vi.fn().mockReturnThis()
    const redirectSpy = vi.fn(() => ({
      unstate: unstateSpy
    }))

    const h = {
      redirect: redirectSpy
    }

    staticPageController.hideMessageHandler(request, h)

    expect(redirectSpy).toHaveBeenCalledWith('/')
  })
})
