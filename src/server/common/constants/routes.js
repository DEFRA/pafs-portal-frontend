export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  LOGOUT: '/logout',
  FORGOT_PASSWORD: '/forgot-password',
  FORGOT_PASSWORD_CONFIRMATION: '/forgot-password/confirmation',
  RESET_PASSWORD: '/reset-password',
  RESET_PASSWORD_SUCCESS: '/reset-password/success',
  RESET_PASSWORD_TOKEN_EXPIRED: '/reset-password/token-expired',
  SET_PASSWORD: '/set-password',
  SET_PASSWORD_TOKEN_EXPIRED: '/set-password/link-expired',

  // General user routes
  GENERAL: {
    HOME: '/',
    PROPOSALS: '/',
    DOWNLOAD: '/download',
    ARCHIVE: '/archive',
    ACCESSIBILITY: '/accessibility'
  },

  // Admin routes
  ADMIN: {
    JOURNEY_SELECTION: '/admin/journey-selection',
    USERS: '/admin/users',
    USERS_PENDING: '/admin/users/pending',
    USERS_ACTIVE: '/admin/users/active',
    USER_VIEW: '/admin/users/{id}',
    PROJECTS: '/admin/projects',
    SUBMISSIONS: '/admin/submissions',
    ORGANISATIONS: '/admin/organisations',
    DOWNLOAD_PROJECTS: '/admin/download-projects',
    DOWNLOAD_RMA: '/admin/download-rma'
  },

  // Project Proposal routes
  PROJECT_PROPOSAL: {
    START_PROPOSAL: '/project-proposal/start',
    PROJECT_NAME: '/project-proposal/project-name',
    PROJECT_TYPE: '/project-proposal/project-type'
  }
}
