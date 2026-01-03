import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readdirSync } from 'node:fs'
import { createLogger } from '../logging/logger.js'
import { config } from '../../../../config/config.js'

const fileName = fileURLToPath(import.meta.url)
const dirName = dirname(fileName)
const logger = createLogger()

/**
 * I18n Service Configuration
 * Provides internationalization support for the application with i18next-fs-backend
 *
 * Benefits of using i18next-fs-backend:
 * - Hot reloading in development (translations update without restart)
 * - Lazy loading support (load namespaces on-demand)
 * - Better error handling and logging
 * - Built-in caching mechanisms
 * - Production-ready with automatic optimization
 */
class I18nService {
  i18n = null
  defaultLocale = 'en'
  supportedLocales = ['en']
  fallbackLocale = 'en'
  initialized = false

  /**
   * Initialize the i18n service with fs-backend
   * @param {Object} options - Configuration options
   * @param {string} options.defaultLocale - Default locale (default: 'en')
   * @param {Array<string>} options.supportedLocales - Array of supported locales (default: ['en'])
   * @param {string} options.fallbackLocale - Fallback locale (default: 'en')
   * @param {string} options.localesPath - Path to locales directory (optional)
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    if (this.initialized) {
      return
    }

    this.defaultLocale = options.defaultLocale || 'en'
    this.supportedLocales = options.supportedLocales || ['en']
    this.fallbackLocale = options.fallbackLocale || 'en'

    const localesPath = options.localesPath || join(dirName, '../../locales')
    const isDevelopment = config.get('isDevelopment')

    try {
      // Discover available namespaces
      const namespaces = this._discoverNamespaces(localesPath)

      // Initialize i18next with fs-backend
      await i18next.use(Backend).init({
        lng: this.defaultLocale,
        fallbackLng: this.fallbackLocale,
        supportedLngs: this.supportedLocales,
        preload: this.supportedLocales,
        ns: namespaces,
        defaultNS: 'common',
        fallbackNS: 'common',
        interpolation: {
          escapeValue: false // Not needed for server-side rendering
        },
        returnNull: false,
        returnEmptyString: false,
        keySeparator: '.',
        nsSeparator: ':',
        backend: {
          // Path to translation files
          loadPath: join(localesPath, '{{lng}}/{{ns}}.json'),
          // Add path for adding missing keys (useful in development)
          addPath: isDevelopment
            ? join(localesPath, '{{lng}}/{{ns}}.missing.json')
            : undefined,
          // JSON spacing for better readability
          jsonIndent: 2
        },
        // Disable debug mode to prevent logging locale file contents
        debug: false,
        // Save missing keys in development
        saveMissing: isDevelopment,
        // Update missing keys in development
        updateMissing: isDevelopment
      })

      this.i18n = i18next
      this.initialized = true
      logger.info(
        {
          locales: this.supportedLocales,
          namespaces,
          isDevelopment
        },
        'I18n service initialized with fs-backend'
      )
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize i18n service')
      throw error
    }
  }

  /**
   * Discover available namespaces by scanning locale directories
   * @param {string} localesPath - Path to locales directory
   * @returns {Array<string>} Array of namespace names
   * @private
   */
  _discoverNamespaces(localesPath) {
    try {
      const defaultLocalePath = join(localesPath, this.defaultLocale)
      const files = readdirSync(defaultLocalePath).filter(
        (file) => file.endsWith('.json') && !file.includes('.missing.')
      )

      const namespaces = files.map((file) => file.replace('.json', ''))
      logger.info({ namespaces }, 'Discovered translation namespaces')
      return namespaces
    } catch (error) {
      logger.warn(
        { err: error },
        'Failed to discover namespaces, using default'
      )
      return ['common']
    }
  }

  /**
   * Translate a key with optional interpolation values
   * @param {string} key - Translation key (e.g., 'auth:login.title' or 'common.errors.not_found')
   * @param {Object} options - Translation options
   * @param {string} options.locale - Locale to use (optional, uses default if not provided)
   * @param {Object} options.params - Interpolation parameters (optional)
   * @returns {string} Translated string
   */
  translate(key, options = {}) {
    if (!this.initialized) {
      logger.warn('I18n service not initialized, returning key')
      return key
    }

    // Handle null, undefined, or non-string keys
    if (!key || typeof key !== 'string') {
      logger.warn({ key }, 'Invalid translation key provided')
      return key || ''
    }

    const { locale, params } = options
    const lng = locale || this.defaultLocale

    // Convert dot notation to namespace:key format for i18next
    // e.g., 'common.sign_in' -> 'common:sign_in'
    const parts = key.split('.')
    const namespace = parts[0]
    const translationKey = parts.slice(1).join('.')
    const i18nextKey = translationKey
      ? `${namespace}:${translationKey}`
      : namespace

    return this.i18n.t(i18nextKey, { lng, ...params })
  }

  /**
   * Alias for translate method (shorter syntax)
   */
  t(key, options = {}) {
    return this.translate(key, options)
  }

  /**
   * Check if a translation key exists
   * @param {string} key - Translation key
   * @param {string} locale - Locale to check (optional)
   * @returns {boolean} True if key exists
   */
  exists(key, locale = null) {
    if (!this.initialized) {
      return false
    }

    const lng = locale || this.defaultLocale
    return this.i18n.exists(key, { lng })
  }

  /**
   * Get current language
   * @returns {string} Current locale
   */
  getLanguage() {
    return this.i18n ? this.i18n.language : this.defaultLocale
  }
}

// Create and export a singleton instance
const i18nService = new I18nService()

// Simple translate function for backward compatibility
export function translate(key, locale = 'en', params = {}) {
  return i18nService.translate(key, { locale, params })
}

export const i18nPlugin = {
  plugin: {
    name: 'i18n',
    async register(server) {
      // Initialize i18n service
      await i18nService.initialize()

      server.decorate('request', 't', function (key, params) {
        return i18nService.translate(key, { params })
      })

      server.decorate('toolkit', 't', function (key, params) {
        return i18nService.translate(key, { params })
      })
    }
  }
}

export default i18nService
export { I18nService }
