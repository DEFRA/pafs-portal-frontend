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
    STATIC_PAGES: {
      PRIVACY_NOTICE: '/privacy-notice',
      ACCESSIBILITY: '/accessibility',
      COOKIES: '/cookies',
      COOKIE_SETTINGS: '/cookie-settings',
      COOKIE_CONSENT_ACCEPT: '/cookies/accept',
      COOKIE_CONSENT_REJECT: '/cookies/reject',
      COOKIE_CONSENT_HIDE: '/cookies/hide-message'
    },
    ACCOUNTS: {
      OLD: '/account_requests/new',
      START: '/request-account',
      DETAILS: '/request-account/details',
      PARENT_AREAS: '/request-account/parent-areas',
      PARENT_AREAS_EA: '/request-account/parent-areas/ea',
      PARENT_AREAS_PSO: '/request-account/parent-areas/pso',
      MAIN_AREA: '/request-account/main-area',
      ADDITIONAL_AREAS: '/request-account/additional-areas',
      CHECK_ANSWERS: '/request-account/check-answers',
      CONFIRMATION: '/request-account/confirmation'
    }
  },

  // Admin routes
  ADMIN: {
    JOURNEY_SELECTION: '/admin/journey-selection',
    USERS: '/admin/users',
    USERS_PENDING: '/admin/users/pending',
    USERS_ACTIVE: '/admin/users/active',
    USERS_DOWNLOAD: '/admin/users/download',
    USER_VIEW: '/admin/users/{encodedId}/view',
    USER_ACTIONS: {
      APPROVE: '/admin/users/{encodedId}/approve',
      DELETE: '/admin/users/{encodedId}/delete',
      RESEND_INVITATION: '/admin/users/{encodedId}/resend-invitation',
      REACTIVATE: '/admin/users/{encodedId}/reactivate',
      EDIT_DETAILS: '/admin/users/{encodedId}/edit-details'
    },
    ACCOUNTS: {
      START: '/admin/user-account',
      IS_ADMIN: '/admin/user-account/is-admin',
      DETAILS: '/admin/user-account/details',
      PARENT_AREAS: '/admin/user-account/parent-areas',
      PARENT_AREAS_EA: '/admin/user-account/parent-areas/ea',
      PARENT_AREAS_PSO: '/admin/user-account/parent-areas/pso',
      MAIN_AREA: '/admin/user-account/main-area',
      ADDITIONAL_AREAS: '/admin/user-account/additional-areas',
      CHECK_ANSWERS: '/admin/user-account/check-answers',
      CONFIRMATION: '/admin/user-account/confirmation',
      EDIT: {
        IS_ADMIN: '/admin/user-account/is-admin/{encodedId}/edit',
        DETAILS: '/admin/user-account/details/{encodedId}/edit',
        PARENT_AREAS:
          '/admin/user-account/parent-areas/{type}/{encodedId}/edit',
        MAIN_AREA: '/admin/user-account/main-area/{encodedId}/edit',
        ADDITIONAL_AREAS:
          '/admin/user-account/additional-areas/{encodedId}/edit',
        CHECK_ANSWERS: '/admin/user-account/check-answers/{encodedId}/edit'
      }
    },
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
    RMA_SELECTION: '/project-proposal/rma-selection',
    PROJECT_TYPE: '/project-proposal/project-type',
    INTERVENTION_TYPE: '/project-proposal/intervention-type',
    PRIMARY_INTERVENTION_TYPE: '/project-proposal/primary-intervention-type'
  }
}
