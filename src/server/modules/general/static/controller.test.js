import { describe, it, expect, beforeEach, vi } from 'vitest'
import { staticPageController } from './controller.js'
import { config } from '../../../../config/config.js'

vi.mock('../../../../config/config.js')
vi.mock('./static-page-config.js', () => ({
  STATIC_PAGE_CONFIG: {
    '/privacy-notice': {
      view: 'modules/general/static/privacy-notice/index',
      titleKey: 'privacy.pages.privacy_notice.title',
      headingKey: 'privacy.pages.privacy_notice.heading'
    }
  }
}))

describe('StaticPageController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      path: '/privacy-notice',
      t: vi.fn((key) => `translated_${key}`)
    }

    mockH = {
      view: vi.fn((template, data) => ({ template, data })),
      response: vi.fn((message) => ({
        code: vi.fn((statusCode) => ({ message, statusCode }))
      }))
    }
  })

  describe('handler', () => {
    it('should render privacy-notice page with lastUpdatedDate from config', () => {
      config.get.mockReturnValue('24 September 2021')
      mockRequest.t.mockImplementation((key) => `translated_${key}`)

      const result = staticPageController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/general/static/privacy-notice/index',
        {
          pageTitle: 'translated_privacy.pages.privacy_notice.title',
          heading: 'translated_privacy.pages.privacy_notice.heading',
          lastUpdatedDate: '24 September 2021'
        }
      )
      expect(config.get).toHaveBeenCalledWith('privacyNotice.lastUpdatedDate')
      expect(result).toEqual({
        template: 'modules/general/static/privacy-notice/index',
        data: {
          pageTitle: 'translated_privacy.pages.privacy_notice.title',
          heading: 'translated_privacy.pages.privacy_notice.heading',
          lastUpdatedDate: '24 September 2021'
        }
      })
    })

    it('should return 404 for unknown path', () => {
      mockRequest.path = '/unknown-page'

      const mockCodeResponse = { message: 'Page not found', statusCode: 404 }
      mockH.response.mockReturnValue({
        code: vi.fn(() => mockCodeResponse)
      })

      const result = staticPageController.handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith('Page not found')
      expect(result).toEqual(mockCodeResponse)
      expect(mockH.view).not.toHaveBeenCalled()
    })

    it('should translate all required keys for privacy-notice page', () => {
      config.get.mockReturnValue('1 January 2026')
      mockRequest.path = '/privacy-notice'
      mockRequest.t.mockImplementation((key) => {
        const translations = {
          'privacy.pages.privacy_notice.title': 'Privacy Notice',
          'privacy.pages.privacy_notice.heading':
            'Project Application and Funding Service Privacy Notice'
        }
        return translations[key] || `missing_${key}`
      })

      staticPageController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'privacy.pages.privacy_notice.title'
      )
      expect(mockRequest.t).toHaveBeenCalledWith(
        'privacy.pages.privacy_notice.heading'
      )
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/general/static/privacy-notice/index',
        {
          pageTitle: 'Privacy Notice',
          heading: 'Project Application and Funding Service Privacy Notice',
          lastUpdatedDate: '1 January 2026'
        }
      )
    })

    it('should handle privacy-notice page with different config values', () => {
      config.get.mockReturnValue('31 December 2025')
      mockRequest.path = '/privacy-notice'

      staticPageController.handler(mockRequest, mockH)

      expect(config.get).toHaveBeenCalledWith('privacyNotice.lastUpdatedDate')
      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          lastUpdatedDate: '31 December 2025'
        })
      )
    })

    it('should not add lastUpdatedDate for non-privacy-notice pages', () => {
      // Since we only have privacy-notice page configured, we test with an unknown path
      mockRequest.path = '/some-other-page'

      staticPageController.handler(mockRequest, mockH)

      // Should return 404, not call view
      expect(mockH.view).not.toHaveBeenCalled()
    })
  })
})
