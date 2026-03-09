import { ROUTES } from '../../../../common/constants/routes.js'
import { PROJECT_STEPS } from '../../../../common/constants/projects.js'
import {
  nfmHeadwaterDrainageSchema,
  nfmLeakyBarriersSchema,
  nfmOfflineStorageSchema,
  nfmRiverRestorationSchema,
  nfmSelectedMeasuresSchema,
  nfmWoodlandSchema
} from '../../schema.js'

/**
 * Configuration for NFM (Natural Flood Management) related steps
 */
export const NFM_CONFIG = {
  [PROJECT_STEPS.NFM_SELECTED_MEASURES]: {
    localKeyPrefix: 'projects.nfm.selected_measures',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: false
    },
    schema: nfmSelectedMeasuresSchema,
    fieldType: 'checkbox'
  },
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]: {
    localKeyPrefix: 'projects.nfm.river_restoration',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    },
    schema: nfmRiverRestorationSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: {
    localKeyPrefix: 'projects.nfm.leaky_barriers',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
      conditionalRedirect: false
    },
    schema: nfmLeakyBarriersSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: {
    localKeyPrefix: 'projects.nfm.offline_storage',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
      conditionalRedirect: false
    },
    schema: nfmOfflineStorageSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_WOODLAND]: {
    localKeyPrefix: 'projects.nfm.woodland',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
      conditionalRedirect: false
    },
    schema: nfmWoodlandSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]: {
    localKeyPrefix: 'projects.nfm.headwater_drainage',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.WOODLAND,
      conditionalRedirect: false
    },
    schema: nfmHeadwaterDrainageSchema,
    fieldType: 'input'
  }
  // Add more NFM steps here as needed
}
