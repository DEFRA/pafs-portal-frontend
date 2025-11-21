export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  LOGOUT: '/logout',
  FORGOT_PASSWORD: '/forgot-password',
  FORGOT_PASSWORD_CONFIRMATION: '/forgot-password/confirmation',
  RESET_PASSWORD: '/reset-password',
  RESET_PASSWORD_SUCCESS: '/reset-password/success',
  RESET_PASSWORD_TOKEN_EXPIRED: '/reset-password/token-expired',

  // General user routes
  GENERAL: {
    HOME: '/',
    PROPOSALS: '/',
    DOWNLOAD: '/download',
    ARCHIVE: '/archive'
  },

  // Admin routes
  ADMIN: {
    JOURNEY_SELECTION: '/admin/journey-selection',
    USERS: '/admin/users',
    PROJECTS: '/admin/projects',
    SUBMISSIONS: '/admin/submissions',
    ORGANISATIONS: '/admin/organisations',
    DOWNLOAD_PROJECTS: '/admin/download-projects',
    DOWNLOAD_RMA: '/admin/download-rma'
  }
}
