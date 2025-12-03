export const AUTH_VIEWS = {
  LOGIN: 'auth/login/index',
  FORGOT_PASSWORD: 'auth/forgot-password/index',
  FORGOT_PASSWORD_REQUEST_CONFIRMATION: 'auth/forgot-password/confirmation',
  RESET_PASSWORD: 'auth/reset-password/index',
  RESET_PASSWORD_SUCCESS: 'auth/reset-password/success',
  RESET_PASSWORD_TOKEN_EXPIRED: 'auth/reset-password/token-expired'
}

export const ADMIN_VIEWS = {
  JOURNEY_SELECTION: 'admin/journey-selection/index',
  USERS: 'admin/users/index',
  USERS_PENDING: 'admin/users/pending/index',
  USERS_ACTIVE: 'admin/users/active/index'
}

export const LOCALE_KEYS = {
  SIGN_IN: 'auth.login.title',
  PASSWORD_RESET: 'auth.reset_password.title'
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  MAX_VISIBLE_PAGES: 5,
  START_THRESHOLD: 4,
  END_OFFSET: 3
}

export const CACHE_SEGMENTS = {
  ACCOUNTS: 'accounts',
  AREAS: 'areas',
  USERS: 'users'
}
