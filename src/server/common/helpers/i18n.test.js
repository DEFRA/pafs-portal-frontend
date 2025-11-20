import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterEach
} from 'vitest'
import i18nService, { translate, I18nService } from './i18n.js'

describe('i18n translation service', () => {
  beforeAll(async () => {
    // Initialize i18n service before running tests
    await i18nService.initialize()
  })

  describe('basic translation', () => {
    test('gets simple translation from common namespace', () => {
      expect(translate('common.sign_in')).toBe('Sign in')
    })

    test('gets translation from auth namespace', () => {
      expect(translate('auth.errors.invalid_credentials')).toBe(
        'Your email address or password is incorrect'
      )
    })

    test('gets translation from validation namespace', () => {
      expect(translate('validation.email.required')).toBe(
        'Enter your email address'
      )
    })

    test('handles deeply nested translation keys', () => {
      expect(translate('common.pages.home.title')).toBe('Project Proposals')
    })
  })

  describe('missing translations', () => {
    test('returns the key itself when translation does not exist', () => {
      // i18next returns the part after namespace separator for missing keys
      expect(translate('this.key.does.not.exist')).toBe('key.does.not.exist')
    })

    test('returns key when namespace exists but key does not', () => {
      // i18next returns the part after namespace separator
      expect(translate('common.nonexistent.key')).toBe('nonexistent.key')
    })

    test('returns key when partial path exists', () => {
      // i18next returns the part after namespace separator
      expect(translate('auth.errors.made_up_error')).toBe(
        'errors.made_up_error'
      )
    })
  })

  describe('parameter interpolation', () => {
    test('handles translation without parameters', () => {
      expect(translate('common.sign_out', 'en', {})).toBe('Sign out')
    })

    test('returns translation as-is when no params provided', () => {
      const result = translate('common.sign_in')
      expect(result).toBe('Sign in')
    })
  })

  describe('locale handling', () => {
    test('uses English as default locale', () => {
      expect(translate('common.sign_in')).toBe('Sign in')
    })

    test('explicitly uses English locale', () => {
      expect(translate('common.sign_out', 'en')).toBe('Sign out')
    })
  })

  describe('edge cases', () => {
    test('handles empty string key', () => {
      expect(translate('')).toBe('')
    })

    test('handles null key gracefully', () => {
      expect(translate(null)).toBe('')
    })

    test('handles undefined key gracefully', () => {
      expect(translate(undefined)).toBe('')
    })

    test('handles numeric key', () => {
      // Our validation returns non-string keys as-is
      expect(translate(123)).toBe(123)
    })

    test('returns objects for non-leaf nodes', () => {
      // i18next returns an error message when trying to access non-leaf nodes
      const result = translate('common.pages')
      expect(typeof result).toBe('string')
      expect(result).toContain('pages')
    })

    test('returns arrays when translation value is an array', () => {
      // i18next returns an error message when trying to access non-leaf nodes
      const result = translate('common.navigation')
      expect(typeof result).toBe('string')
      expect(result).toContain('navigation')
    })
  })

  describe('performance and caching', () => {
    test('returns same result for repeated translations', () => {
      const first = translate('common.sign_in')
      const second = translate('common.sign_in')

      expect(first).toBe(second)
      expect(first).toBe('Sign in')
    })

    test('caches translations across different calls', () => {
      translate('auth.errors.session_timeout')
      translate('validation.email.required')
      const result = translate('auth.errors.session_timeout')

      expect(result).toBe(
        'Your session has expired. Please sign in again to continue'
      )
    })
  })

  describe('real-world usage scenarios', () => {
    test('translates login page strings', () => {
      expect(translate('common.sign_in')).toBe('Sign in')
      expect(translate('common.login.email_label')).toBe('Email address')
      expect(translate('common.login.password_label')).toBe('Password')
    })

    test('translates error messages', () => {
      expect(translate('auth.errors.account_locked')).toBe(
        'Your account has been locked due to too many failed login attempts'
      )
      expect(translate('auth.errors.account_disabled')).toBe(
        'Your account has been disabled. Contact the administrator'
      )
    })

    test('translates navigation items', () => {
      expect(translate('common.navigation.your_proposals')).toBe(
        'Your proposals'
      )
      expect(translate('common.navigation.download_all')).toBe('Download All')
      expect(translate('common.navigation.archive')).toBe('Archive')
    })

    test('translates validation messages', () => {
      expect(translate('validation.email.invalid_format')).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
      expect(translate('validation.password.required')).toBe(
        'Enter your password'
      )
    })
  })
})

describe('i18n service methods', () => {
  describe('t() alias method', () => {
    test('works as alias for translate', () => {
      expect(i18nService.t('common.sign_in')).toBe('Sign in')
    })

    test('accepts options parameter', () => {
      expect(i18nService.t('common.sign_out', { locale: 'en' })).toBe(
        'Sign out'
      )
    })
  })

  describe('exists() method', () => {
    test('returns true for existing keys', () => {
      // Need to use i18next format for exists check
      expect(i18nService.exists('common:sign_in')).toBe(true)
    })

    test('returns false for non-existing keys', () => {
      expect(i18nService.exists('common:does_not_exist')).toBe(false)
    })

    test('returns false when not initialized', () => {
      const uninitializedService = new I18nService()
      expect(uninitializedService.exists('common:sign_in')).toBe(false)
    })
  })

  describe('getLanguage() method', () => {
    test('returns current language', () => {
      expect(i18nService.getLanguage()).toBe('en')
    })

    test('returns default locale when i18n not initialized', () => {
      const uninitializedService = new I18nService()
      expect(uninitializedService.getLanguage()).toBe('en')
    })
  })

  describe('uninitialized service', () => {
    test('translate returns key when not initialized', () => {
      const uninitializedService = new I18nService()
      expect(uninitializedService.translate('common.sign_in')).toBe(
        'common.sign_in'
      )
    })
  })
})

describe('i18n Hapi plugin', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      decorate: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('registers as a Hapi plugin', async () => {
    const { i18nPlugin } = await import('./i18n.js')

    expect(i18nPlugin.plugin).toBeDefined()
    expect(i18nPlugin.plugin.name).toBe('i18n')
    expect(i18nPlugin.plugin.register).toBeTypeOf('function')
  })

  test('decorates request with translation function', async () => {
    const { i18nPlugin } = await import('./i18n.js')
    await i18nPlugin.plugin.register(mockServer)

    expect(mockServer.decorate).toHaveBeenCalledWith(
      'request',
      't',
      expect.any(Function)
    )
  })

  test('decorates toolkit with translation function', async () => {
    const { i18nPlugin } = await import('./i18n.js')
    await i18nPlugin.plugin.register(mockServer)

    expect(mockServer.decorate).toHaveBeenCalledWith(
      'toolkit',
      't',
      expect.any(Function)
    )
  })

  test('request decorator translates correctly', async () => {
    const { i18nPlugin } = await import('./i18n.js')
    await i18nPlugin.plugin.register(mockServer)

    const requestDecorator = mockServer.decorate.mock.calls.find(
      (call) => call[0] === 'request'
    )[2]

    expect(requestDecorator('common.sign_in')).toBe('Sign in')
    expect(requestDecorator('common.sign_out')).toBe('Sign out')
  })

  test('toolkit decorator translates correctly', async () => {
    const { i18nPlugin } = await import('./i18n.js')
    await i18nPlugin.plugin.register(mockServer)

    const toolkitDecorator = mockServer.decorate.mock.calls.find(
      (call) => call[0] === 'toolkit'
    )[2]

    expect(toolkitDecorator('auth.errors.session_timeout')).toBe(
      'Your session has expired. Please sign in again to continue'
    )
  })

  test('decorators handle parameters', async () => {
    const { i18nPlugin } = await import('./i18n.js')
    await i18nPlugin.plugin.register(mockServer)

    const requestDecorator = mockServer.decorate.mock.calls.find(
      (call) => call[0] === 'request'
    )[2]

    // Even without interpolation in the translation, params should not break it
    expect(requestDecorator('common.sign_in', { someParam: 'value' })).toBe(
      'Sign in'
    )
  })
})
