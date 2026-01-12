export const AUTH_VIEWS = {
  LOGIN: 'modules/auth/login/index',
  FORGOT_PASSWORD: 'modules/auth/forgot-password/index',
  FORGOT_PASSWORD_REQUEST_CONFIRMATION:
    'modules/auth/forgot-password/confirmation',
  RESET_PASSWORD: 'modules/auth/reset-password/index',
  RESET_PASSWORD_SUCCESS: 'modules/auth/reset-password/success',
  RESET_PASSWORD_TOKEN_EXPIRED: 'modules/auth/reset-password/token-expired',
  SET_PASSWORD: 'modules/auth/reset-password/index',
  SET_PASSWORD_TOKEN_EXPIRED: 'modules/auth/set-password/link-expired'
}

export const ADMIN_VIEWS = {
  JOURNEY_SELECTION: 'modules/admin/journey-selection/index',
  USERS_PENDING: 'modules/admin/users/pending/index',
  USERS_ACTIVE: 'modules/admin/users/active/index'
}

export const ACCOUNT_VIEWS = {
  START: 'modules/accounts/start/index',
  DETAILS: 'modules/accounts/details/index',
  IS_ADMIN: 'modules/accounts/is-admin/index',
  PARENT_AREAS: 'modules/accounts/parent-areas/index',
  MAIN_AREA: 'modules/accounts/main-area/index',
  ADDITIONAL_AREAS: 'modules/accounts/additional-areas/index',
  CHECK_ANSWERS: 'modules/accounts/check-answers/index',
  CONFIRMATION: 'modules/accounts/confirmation/index'
}

export const PROPOSAL_VIEWS = {
  START: 'modules/project-proposal/start-proposal/index',
  PROJECT_NAME: 'modules/project-proposal/project-name/index'
}

export const GENERAL_VIEWS = {
  STATIC_PAGES: {
    PRIVACY: 'modules/general/static/views/privacy',
    ACCESSIBILITY: 'modules/general/static/views/accessibility',
    COOKIES: 'modules/general/static/views/cookies',
    COOKIE_SETTINGS: 'modules/general/static/views/cookie-settings'
  }
}

export const LOCALE_KEYS = {
  SIGN_IN: 'auth.login.title',
  PASSWORD_RESET: 'auth.reset_password.title',
  PASSWORD_SET: 'auth.set_password.title'
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  MAX_VISIBLE_PAGES: 5,
  START_THRESHOLD: 4,
  END_OFFSET: 3
}

export const SESSION = {
  REFRESH_BUFFER_MS: 300000, // Refresh 5 minutes before expiry
  INACTIVE_TIMEOUT_MS: 3600000, // 1 hour (60 minutes)
  TOKEN_REFRESH_MS: 900000, // Default 15 minutes
  SESSION_TIMEOUT: 'session-timeout',
  SESSION_MISMATCH: 'session-mismatch'
}

/**
 * SIZE
 */
export const SIZE = {
  LENGTH_8: 8,
  LENGTH_32: 32,
  LENGTH_128: 128,
  LENGTH_254: 254,
  LENGTH_255: 255
}

/**
 * VALIDATION PATTERNS
 * Common regex patterns for field validation
 */
export const VALIDATION_PATTERNS = {
  // Names: letters, spaces, hyphens, apostrophes
  NAME: /^[a-zA-Z\s'-]+$/,

  PROJECT_NAME: /^[a-zA-Z0-9_-]+$/,

  // Job title and organisation: letters, digits, spaces, common punctuation
  // Allows: letters, numbers, spaces, period, comma, ampersand, parentheses, hyphen, apostrophe, forward slash
  TEXT_WITH_COMMON_SYMBOLS: /^[a-zA-Z0-9\s.,&()\-'/]+$/,

  // Telephone: digits, spaces, hyphens, plus, parentheses
  TELEPHONE: /^[\d\s\-+()]+$/
}

/**
 * Token Types
 */
export const TOKEN_TYPES = {
  RESET: 'RESET',
  INVITATION: 'INVITATION'
}

export const CACHE_SEGMENTS = {
  SESSION: 'session',
  APP_DATA: 'app-data',
  ACCOUNTS: 'accounts',
  AREAS: 'areas',
  USERS: 'users'
}

/**
 * Session Keys for Account Flows
 * Defines session storage keys for different account management contexts
 */
export const ACCOUNT_SESSION_KEYS = {
  SELF_REGISTRATION: 'accountData',
  ADMIN_USER_CREATION: 'adminAccountData'
}

// Re-export VIEW_ERROR_CODES from validation constants
export { VIEW_ERROR_CODES } from './validation.js'

export const AREAS_RESPONSIBILITIES_MAP = {
  EA: 'EA Area',
  PSO: 'PSO Area',
  RMA: 'RMA'
}

export const RESPONSIBILITY_MAP = {
  EA: 'EA',
  PSO: 'PSO',
  RMA: 'RMA'
}
