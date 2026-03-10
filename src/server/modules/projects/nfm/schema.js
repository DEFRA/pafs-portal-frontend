/**
 * NFM Schema - Backward Compatibility Entry Point
 *
 * This file maintains backward compatibility by re-exporting from the consolidated schemas file.
 * The actual validation schemas are now in ../schemas/nfm-schemas.js
 *
 * All existing imports from this file will continue to work without changes.
 */

export {
  nfmSelectedMeasuresSchema,
  nfmRiverRestorationSchema,
  nfmLeakyBarriersSchema,
  nfmOfflineStorageSchema,
  nfmWoodlandSchema,
  nfmHeadwaterDrainageSchema,
  nfmRunoffManagementSchema,
  nfmSaltmarshSchema,
  nfmSandDuneSchema
} from '../schemas/nfm-schemas.js'
