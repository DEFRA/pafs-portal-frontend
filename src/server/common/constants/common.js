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
  USERS_ACTIVE: 'modules/admin/users/active/index',
  DELETE_USER: 'modules/admin/users/delete/index',
  ORGANISATIONS: 'modules/admin/organisations/listing/index',
  ORGANISATION_TYPE: 'modules/admin/organisations/type/index',
  ORGANISATION_MANAGE: 'modules/admin/organisations/manage/index'
}

export const ACCOUNT_VIEWS = {
  START: 'modules/accounts/start/index',
  DETAILS: 'modules/accounts/details/index',
  IS_ADMIN: 'modules/accounts/is-admin/index',
  PARENT_AREAS: 'modules/accounts/parent-areas/index',
  MAIN_AREA: 'modules/accounts/main-area/index',
  ADDITIONAL_AREAS: 'modules/accounts/additional-areas/index',
  CHECK_ANSWERS: 'modules/accounts/check-answers/index',
  CONFIRMATION: 'modules/accounts/confirmation/index',
  VIEW_ACCOUNT: 'modules/accounts/view-account/index'
}

export const PROPOSAL_VIEWS = {
  START: 'modules/project-proposal/start-proposal/index',
  PROJECT_NAME: 'modules/project-proposal/proposal-details/project-name/index',
  RMA_SELECTION:
    'modules/project-proposal/proposal-details/rma-selection/index',
  PROJECT_TYPE: 'modules/project-proposal/proposal-details/project-type/index',
  INTERVENTION_TYPE:
    'modules/project-proposal/proposal-details/intervention-type/index',
  PRIMARY_INTERVENTION_TYPE:
    'modules/project-proposal/proposal-details/primary-intervention-type/index',
  PROPOSAL_OVERVIEW: 'modules/project-proposal/proposal-overview/index',
  FIRST_FINANCIAL_YEAR:
    'modules/project-proposal/proposal-details/first-financial-year/index',
  FIRST_FINANCIAL_YEAR_MANUAL:
    'modules/project-proposal/proposal-details/first-financial-year/manual',
  LAST_FINANCIAL_YEAR:
    'modules/project-proposal/proposal-details/last-financial-year/index',
  LAST_FINANCIAL_YEAR_MANUAL:
    'modules/project-proposal/proposal-details/last-financial-year/manual'
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

export const API_LIMITS = {
  MAX_ACCOUNTS_PAGE_SIZE: 10000
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
  LENGTH_1: 1,
  LENGTH_8: 8,
  LENGTH_12: 12,
  LENGTH_10: 10,
  LENGTH_31: 31,
  LENGTH_32: 32,
  LENGTH_100: 100,
  LENGTH_128: 128,
  LENGTH_254: 254,
  LENGTH_255: 255,
  LENGTH_2000: 2000,
  LENGTH_2100: 2100
}

/**
 * VALIDATION PATTERNS
 * Common regex patterns for field validation
 */
export const VALIDATION_PATTERNS = {
  // Names: letters, spaces, hyphens, apostrophes
  NAME: /^[a-zA-Z\s'-]+$/,

  PROJECT_NAME: /^[a-zA-Z0-9_\s-]+$/,

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

export const AREA_SEGMENT_KEYS = {
  BY_TYPE: 'areas-by-type',
  BY_LIST: 'areas-by-list',
  BY_ID: 'area-'
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
  AUTHORITY: 'Authority',
  EA: 'EA Area',
  PSO: 'PSO Area',
  RMA: 'RMA'
}

export const AREAS_LABELS = {
  EA: 'Area Program Team',
  PSO: 'PSO Team',
  RMA: 'RMA'
}

export const RESPONSIBILITY_MAP = {
  EA: 'EA',
  PSO: 'PSO',
  RMA: 'RMA'
}
