import { ROUTES } from '../../../../common/constants/routes.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import {
  nfmHeadwaterDrainageSchema,
  nfmLeakyBarriersSchema,
  nfmOfflineStorageSchema,
  nfmRiverRestorationSchema,
  nfmRunoffManagementSchema,
  nfmLandUseChangeSchema,
  nfmLandUseEnclosedArableFarmlandSchema,
  nfmLandUseEnclosedLivestockFarmlandSchema,
  nfmLandUseEnclosedDairyingFarmlandSchema,
  nfmLandUseSemiNaturalGrasslandSchema,
  nfmLandUseWoodlandSchema,
  nfmLandUseMountainMoorsAndHeathSchema,
  nfmLandUsePeatlandRestorationSchema,
  nfmLandUseRiversWetlandsFreshwaterSchema,
  nfmLandUseCoastalMarginsSchema,
  nfmLandownerConsentSchema,
  nfmExperienceLevelSchema,
  nfmSaltmarshSchema,
  nfmSandDuneSchema,
  nfmSelectedMeasuresSchema,
  nfmWoodlandSchema,
  nfmProjectReadinessSchema
} from '../../schema.js'

const AREA_LABEL = 'area.label'
const VOLUME_LABEL = 'volume.label'
const VOLUME_HINT = 'volume.hint'
const LENGTH_LABEL = 'length.label'
const LENGTH_HINT = 'length.hint'
const WIDTH_LABEL = 'width.label'

/**
 * Configuration for NFM (Natural Flood Management) related steps
 */
export const NFM_CONFIG = {
  [PROJECT_STEPS.NFM_SELECTED_MEASURES]: {
    localKeyPrefix: 'projects.nfm.selected_measures',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
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
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA,
        labelKey: AREA_LABEL,
        suffix: 'hectares'
      },
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME,
        labelKey: VOLUME_LABEL,
        hintKey: VOLUME_HINT,
        suffix: 'm³'
      }
    ]
  },
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: {
    localKeyPrefix: 'projects.nfm.leaky_barriers',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
      conditionalRedirect: false
    },
    schema: nfmLeakyBarriersSchema,
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME,
        labelKey: VOLUME_LABEL,
        hintKey: VOLUME_HINT,
        suffix: 'm³'
      },
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH,
        labelKey: LENGTH_LABEL,
        suffix: 'km'
      },
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH,
        labelKey: WIDTH_LABEL,
        suffix: 'm'
      }
    ]
  },
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: {
    localKeyPrefix: 'projects.nfm.offline_storage',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
      conditionalRedirect: false
    },
    schema: nfmOfflineStorageSchema,
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA,
        labelKey: AREA_LABEL,
        suffix: 'hectares'
      },
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME,
        labelKey: VOLUME_LABEL,
        hintKey: VOLUME_HINT,
        suffix: 'm³'
      }
    ]
  },
  [PROJECT_STEPS.NFM_WOODLAND]: {
    localKeyPrefix: 'projects.nfm.woodland',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
      conditionalRedirect: false
    },
    schema: nfmWoodlandSchema,
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA,
        labelKey: AREA_LABEL,
        suffix: 'hectares'
      }
    ]
  },
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]: {
    localKeyPrefix: 'projects.nfm.headwater_drainage',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.WOODLAND,
      conditionalRedirect: false
    },
    schema: nfmHeadwaterDrainageSchema,
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA,
        labelKey: AREA_LABEL,
        suffix: 'hectares'
      }
    ]
  },
  [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]: {
    localKeyPrefix: 'projects.nfm.runoff_management',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.HEADWATER_DRAINAGE,
      conditionalRedirect: false
    },
    schema: nfmRunoffManagementSchema,
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA,
        labelKey: AREA_LABEL,
        suffix: 'hectares'
      },
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME,
        labelKey: VOLUME_LABEL,
        hintKey: VOLUME_HINT,
        suffix: 'm³'
      }
    ]
  },
  [PROJECT_STEPS.NFM_SALTMARSH]: {
    localKeyPrefix: 'projects.nfm.saltmarsh',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.RUNOFF_MANAGEMENT,
      conditionalRedirect: false
    },
    schema: nfmSaltmarshSchema,
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA,
        labelKey: AREA_LABEL,
        suffix: 'hectares'
      },
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH,
        labelKey: LENGTH_LABEL,
        hintKey: LENGTH_HINT,
        suffix: 'km'
      }
    ]
  },
  [PROJECT_STEPS.NFM_SAND_DUNE]: {
    localKeyPrefix: 'projects.nfm.sand_dune',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SALTMARSH,
      conditionalRedirect: false
    },
    schema: nfmSandDuneSchema,
    fieldType: 'input',
    inputFields: [
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA,
        labelKey: AREA_LABEL,
        suffix: 'hectares'
      },
      {
        name: PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH,
        labelKey: LENGTH_LABEL,
        hintKey: LENGTH_HINT,
        suffix: 'km'
      }
    ]
  },
  [PROJECT_STEPS.NFM_LAND_USE_CHANGE]: {
    localKeyPrefix: 'projects.nfm.land_use_change',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SAND_DUNE,
      conditionalRedirect: false
    },
    schema: nfmLandUseChangeSchema,
    fieldType: 'checkbox'
  },
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND]: {
    localKeyPrefix: 'projects.nfm.land_use.enclosed_arable_farmland',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseEnclosedArableFarmlandSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND]: {
    localKeyPrefix: 'projects.nfm.land_use.enclosed_livestock_farmland',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseEnclosedLivestockFarmlandSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND]: {
    localKeyPrefix: 'projects.nfm.land_use.enclosed_dairying_farmland',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseEnclosedDairyingFarmlandSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND]: {
    localKeyPrefix: 'projects.nfm.land_use.semi_natural_grassland',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseSemiNaturalGrasslandSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_WOODLAND]: {
    localKeyPrefix: 'projects.nfm.land_use.woodland',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseWoodlandSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH]: {
    localKeyPrefix: 'projects.nfm.land_use.mountain_moors_and_heath',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseMountainMoorsAndHeathSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_PEATLAND_RESTORATION]: {
    localKeyPrefix: 'projects.nfm.land_use.peatland_restoration',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUsePeatlandRestorationSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER]: {
    localKeyPrefix: 'projects.nfm.land_use.rivers_wetlands_freshwater_habitats',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseRiversWetlandsFreshwaterSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LAND_USE_COASTAL_MARGINS]: {
    localKeyPrefix: 'projects.nfm.land_use.coastal_margins',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    },
    schema: nfmLandUseCoastalMarginsSchema,
    fieldType: 'input'
  },
  [PROJECT_STEPS.NFM_LANDOWNER_CONSENT]: {
    localKeyPrefix: 'projects.nfm.landowner_consent',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_COASTAL_MARGINS,
      conditionalRedirect: false
    },
    schema: nfmLandownerConsentSchema,
    fieldType: 'radio',
    radioFieldName: PROJECT_PAYLOAD_FIELDS.NFM_LANDOWNER_CONSENT,
    radioOptionsType: 'landownerConsent'
  },
  [PROJECT_STEPS.NFM_EXPERIENCE]: {
    localKeyPrefix: 'projects.nfm.experience',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LANDOWNER_CONSENT,
      conditionalRedirect: false
    },
    schema: nfmExperienceLevelSchema,
    fieldType: 'radio',
    radioFieldName: PROJECT_PAYLOAD_FIELDS.NFM_EXPERIENCE_LEVEL,
    radioOptionsType: 'experience'
  },
  [PROJECT_STEPS.NFM_PROJECT_READINESS]: {
    localKeyPrefix: 'projects.nfm.project_readiness',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.EXPERIENCE,
      conditionalRedirect: false
    },
    schema: nfmProjectReadinessSchema,
    fieldType: 'radio',
    radioFieldName: PROJECT_PAYLOAD_FIELDS.NFM_PROJECT_READINESS,
    radioOptionsType: 'projectReadiness'
  }
}
