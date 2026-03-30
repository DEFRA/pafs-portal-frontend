// Utility to clear all NFM-related fields from the session
export default function clearNfmFields(sessionData) {
  const nfmFieldPrefixes = ['NFM_', 'nfm_', 'pafs_core_nfm_']
  // All known camelCase NFM fields in session
  const nfmFieldNames = new Set([
    'nfmSelectedMeasures',
    'nfmLandUseChange',
    'nfmLandownerConsent',
    'nfmExperienceLevel',
    'nfmProjectReadiness',
    'nfmRiverRestorationArea',
    'nfmRiverRestorationVolume',
    'nfmLeakyBarriersLength',
    'nfmLeakyBarriersWidth',
    'nfmOfflineStorageArea',
    'nfmSaltmarshArea',
    'nfmSaltmarshLength',
    'nfmSandDuneArea',
    'nfmSandDuneLength',
    'nfmEnclosedArableFarmlandBefore',
    'nfmEnclosedArableFarmlandAfter',
    'nfmEnclosedLivestockFarmlandBefore',
    'nfmEnclosedLivestockFarmlandAfter',
    'nfmEnclosedDairyingFarmlandBefore',
    'nfmEnclosedDairyingFarmlandAfter'
  ])
  const cleared = { ...sessionData }
  Object.keys(cleared).forEach((key) => {
    if (
      nfmFieldPrefixes.some((prefix) => key.startsWith(prefix)) ||
      nfmFieldNames.has(key)
    ) {
      delete cleared[key]
    }
  })
  // Remove known NFM arrays if present
  delete cleared.pafs_core_nfm_measures
  delete cleared.pafs_core_nfm_land_use_changes
  return cleared
}
