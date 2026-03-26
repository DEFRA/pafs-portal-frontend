import { PROJECT_STEPS } from './projects.js'

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
      REACTIVATE: '/admin/users/{encodedId}/reactivate'
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
        IS_ADMIN: '/admin/user-account/is-admin/{encodedId}',
        DETAILS: '/admin/user-account/details/{encodedId}',
        PARENT_AREAS: '/admin/user-account/parent-areas/{type}/{encodedId}',
        MAIN_AREA: '/admin/user-account/main-area/{encodedId}',
        ADDITIONAL_AREAS: '/admin/user-account/additional-areas/{encodedId}',
        CHECK_ANSWERS: '/admin/user-account/check-answers/{encodedId}'
      }
    },
    PROJECTS: '/admin/projects',
    SUBMISSIONS: '/admin/submissions',
    ORGANISATIONS: '/admin/organisations',
    DOWNLOAD_PROJECTS: '/admin/download-projects',
    DOWNLOAD_RMA: '/admin/download-rma'
  },

  PROJECT: {
    OVERVIEW: '/project/{referenceNumber}',
    ARCHIVE: '/project/{referenceNumber}/archive',
    REVERT_TO_DRAFT: '/project/{referenceNumber}/revert-to-draft',
    ARCHIVE_CONFIRMATION: '/project/{referenceNumber}/archive/confirmation',
    START: `/project/${PROJECT_STEPS.START}`,
    NAME: `/project/${PROJECT_STEPS.NAME}`,
    AREA: `/project/${PROJECT_STEPS.AREA}`,
    TYPE: `/project/${PROJECT_STEPS.TYPE}`,
    INTERVENTION_TYPE: `/project/${PROJECT_STEPS.INTERVENTION_TYPE}`,
    PRIMARY_INTERVENTION_TYPE: `/project/${PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE}`,
    FINANCIAL_START_YEAR: `/project/${PROJECT_STEPS.FINANCIAL_START_YEAR}`,
    FINANCIAL_START_YEAR_MANUAL: `/project/${PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL}`,
    FINANCIAL_END_YEAR: `/project/${PROJECT_STEPS.FINANCIAL_END_YEAR}`,
    FINANCIAL_END_YEAR_MANUAL: `/project/${PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL}`,
    EDIT: {
      NAME: `/project/{referenceNumber}/${PROJECT_STEPS.NAME}`,
      TYPE: `/project/{referenceNumber}/${PROJECT_STEPS.TYPE}`,
      INTERVENTION_TYPE: `/project/{referenceNumber}/${PROJECT_STEPS.INTERVENTION_TYPE}`,
      PRIMARY_INTERVENTION_TYPE: `/project/{referenceNumber}/${PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE}`,
      FINANCIAL_START_YEAR: `/project/{referenceNumber}/${PROJECT_STEPS.FINANCIAL_START_YEAR}`,
      FINANCIAL_START_YEAR_MANUAL: `/project/{referenceNumber}/${PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL}`,
      FINANCIAL_END_YEAR: `/project/{referenceNumber}/${PROJECT_STEPS.FINANCIAL_END_YEAR}`,
      FINANCIAL_END_YEAR_MANUAL: `/project/{referenceNumber}/${PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL}`,
      START_OUTLINE_BUSINESS_CASE: `/project/{referenceNumber}/${PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE}`,
      COMPLETE_OUTLINE_BUSINESS_CASE: `/project/{referenceNumber}/${PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE}`,
      AWARD_MAIN_CONTRACT: `/project/{referenceNumber}/${PROJECT_STEPS.AWARD_MAIN_CONTRACT}`,
      START_WORK: `/project/{referenceNumber}/${PROJECT_STEPS.START_WORK}`,
      START_BENEFITS: `/project/{referenceNumber}/${PROJECT_STEPS.START_BENEFITS}`,
      COULD_START_EARLY: `/project/{referenceNumber}/${PROJECT_STEPS.COULD_START_EARLY}`,
      EARLIEST_START_DATE: `/project/{referenceNumber}/${PROJECT_STEPS.EARLIEST_START_DATE}`,
      BENEFIT_AREA: `/project/{referenceNumber}/${PROJECT_STEPS.BENEFIT_AREA}`,
      BENEFIT_AREA_UPLOAD_STATUS: `/project/{referenceNumber}/${PROJECT_STEPS.BENEFIT_AREA}/upload-status`,
      BENEFIT_AREA_DELETE: `/project/{referenceNumber}/${PROJECT_STEPS.BENEFIT_AREA}/delete`,
      RISK: `/project/{referenceNumber}/${PROJECT_STEPS.RISK}`,
      MAIN_RISK: `/project/{referenceNumber}/${PROJECT_STEPS.MAIN_RISK}`,
      PROPERTY_AFFECTED_FLOODING: `/project/{referenceNumber}/${PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING}`,
      PROPERTY_AFFECTED_COASTAL_EROSION: `/project/{referenceNumber}/${PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION}`,
      TWENTY_PERCENT_DEPRIVED: `/project/{referenceNumber}/${PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED}`,
      FORTY_PERCENT_DEPRIVED: `/project/{referenceNumber}/${PROJECT_STEPS.FORTY_PERCENT_DEPRIVED}`,
      CURRENT_FLOOD_FLUVIAL_RISK: `/project/{referenceNumber}/${PROJECT_STEPS.CURRENT_FLOOD_FLUVIAL_RISK}`,
      CURRENT_FLOOD_SURFACE_WATER_RISK: `/project/{referenceNumber}/${PROJECT_STEPS.CURRENT_FLOOD_SURFACE_WATER_RISK}`,
      CURRENT_COASTAL_EROSION_RISK: `/project/{referenceNumber}/${PROJECT_STEPS.CURRENT_COASTAL_EROSION_RISK}`,
      PROJECT_GOALS: `/project/{referenceNumber}/${PROJECT_STEPS.PROJECT_GOALS}`,
      URGENCY_REASON: `/project/{referenceNumber}/${PROJECT_STEPS.URGENCY_REASON}`,
      URGENCY_DETAILS: `/project/{referenceNumber}/${PROJECT_STEPS.URGENCY_DETAILS}`,
      CONFIDENCE_HOMES_BETTER_PROTECTED: `/project/{referenceNumber}/${PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED}`,
      CONFIDENCE_HOMES_BY_GATEWAY_FOUR: `/project/{referenceNumber}/${PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR}`,
      CONFIDENCE_SECURED_PARTNERSHIP_FUNDING: `/project/{referenceNumber}/${PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING}`,
      ENVIRONMENTAL_BENEFITS: `/project/{referenceNumber}/${PROJECT_STEPS.ENVIRONMENTAL_BENEFITS}`,
      INTERTIDAL_HABITAT: `/project/{referenceNumber}/${PROJECT_STEPS.INTERTIDAL_HABITAT}`,
      HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED}`,
      WOODLAND: `/project/{referenceNumber}/${PROJECT_STEPS.WOODLAND}`,
      HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED}`,
      WET_WOODLAND: `/project/{referenceNumber}/${PROJECT_STEPS.WET_WOODLAND}`,
      HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED}`,
      WETLAND_OR_WET_GRASSLAND: `/project/{referenceNumber}/${PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND}`,
      HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED}`,
      GRASSLAND: `/project/{referenceNumber}/${PROJECT_STEPS.GRASSLAND}`,
      HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED}`,
      HEATHLAND: `/project/{referenceNumber}/${PROJECT_STEPS.HEATHLAND}`,
      HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED}`,
      PONDS_LAKES: `/project/{referenceNumber}/${PROJECT_STEPS.PONDS_LAKES}`,
      HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED}`,
      ARABLE_LAND: `/project/{referenceNumber}/${PROJECT_STEPS.ARABLE_LAND}`,
      HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED: `/project/{referenceNumber}/${PROJECT_STEPS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED}`,
      COMPREHENSIVE_RESTORATION: `/project/{referenceNumber}/${PROJECT_STEPS.COMPREHENSIVE_RESTORATION}`,
      KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE: `/project/{referenceNumber}/${PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE}`,
      PARTIAL_RESTORATION: `/project/{referenceNumber}/${PROJECT_STEPS.PARTIAL_RESTORATION}`,
      KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL: `/project/{referenceNumber}/${PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL}`,
      CREATE_HABITAT_WATERCOURSE: `/project/{referenceNumber}/${PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE}`,
      KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE: `/project/{referenceNumber}/${PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE}`,
      NFM: {
        SELECTED_MEASURES: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_SELECTED_MEASURES}`,
        RIVER_RESTORATION: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_RIVER_RESTORATION}`,
        LEAKY_BARRIERS: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LEAKY_BARRIERS}`,
        OFFLINE_STORAGE: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_OFFLINE_STORAGE}`,
        WOODLAND: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_WOODLAND}`,
        HEADWATER_DRAINAGE: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_HEADWATER_DRAINAGE}`,
        RUNOFF_MANAGEMENT: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT}`,
        SALTMARSH: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_SALTMARSH}`,
        SAND_DUNE: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_SAND_DUNE}`,
        LAND_USE_CHANGE: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_CHANGE}`,
        LAND_USE_ENCLOSED_ARABLE_FARMLAND: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND}`,
        LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND}`,
        LAND_USE_ENCLOSED_DAIRYING_FARMLAND: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND}`,
        LAND_USE_SEMI_NATURAL_GRASSLAND: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND}`,
        LAND_USE_WOODLAND: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_WOODLAND}`,
        LAND_USE_MOUNTAIN_MOORS_AND_HEATH: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH}`,
        LAND_USE_PEATLAND_RESTORATION: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_PEATLAND_RESTORATION}`,
        LAND_USE_RIVERS_WETLANDS_FRESHWATER: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER}`,
        LAND_USE_COASTAL_MARGINS: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LAND_USE_COASTAL_MARGINS}`,
        LANDOWNER_CONSENT: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_LANDOWNER_CONSENT}`,
        EXPERIENCE: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_EXPERIENCE}`,
        PROJECT_READINESS: `/project/{referenceNumber}/${PROJECT_STEPS.NFM_PROJECT_READINESS}`
      },
      WHOLE_LIFE_COST: `/project/{referenceNumber}/${PROJECT_STEPS.WHOLE_LIFE_COST}`
    }
  },

  // Project Proposal routes
  PROJECT_PROPOSAL: {
    START_PROPOSAL: '/project-proposal/start',
    PROJECT_NAME: '/project-proposal/project-name',
    RMA_SELECTION: '/project-proposal/rma-selection',
    PROJECT_TYPE: '/project-proposal/project-type',
    INTERVENTION_TYPE: '/project-proposal/intervention-type',
    PRIMARY_INTERVENTION_TYPE: '/project-proposal/primary-intervention-type',
    FIRST_FINANCIAL_YEAR: '/project-proposal/first-financial-year',
    FIRST_FINANCIAL_YEAR_MANUAL:
      '/project-proposal/first-financial-year-manual',
    LAST_FINANCIAL_YEAR: '/project-proposal/last-financial-year',
    LAST_FINANCIAL_YEAR_MANUAL: '/project-proposal/last-financial-year-manual',
    PROPOSAL_OVERVIEW: '/project-proposal/proposal-overview/{referenceNumber}',
    EDIT: {
      PROJECT_NAME: '/project-proposal/project-name/{referenceNumber}/edit',
      RMA_SELECTION: '/project-proposal/rma-selection/{referenceNumber}/edit',
      PROJECT_TYPE: '/project-proposal/project-type/{referenceNumber}/edit',
      INTERVENTION_TYPE:
        '/project-proposal/intervention-type/{referenceNumber}/edit',
      PRIMARY_INTERVENTION_TYPE:
        '/project-proposal/primary-intervention-type/{referenceNumber}/edit',
      FIRST_FINANCIAL_YEAR:
        '/project-proposal/first-financial-year/{referenceNumber}/edit',
      FIRST_FINANCIAL_YEAR_MANUAL:
        '/project-proposal/first-financial-year-manual/{referenceNumber}/edit',
      LAST_FINANCIAL_YEAR:
        '/project-proposal/last-financial-year/{referenceNumber}/edit',
      LAST_FINANCIAL_YEAR_MANUAL:
        '/project-proposal/last-financial-year-manual/{referenceNumber}/edit'
    }
  }
}
