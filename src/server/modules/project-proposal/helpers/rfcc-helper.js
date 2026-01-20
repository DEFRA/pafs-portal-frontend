/**
 * Helper to extract RFCC code from area data based on area hierarchy
 *
 * Area Hierarchy:
 * Level 1: EA (Environment Agency) - Top level, no parent
 * Level 2: PSO (Partnership Support Officer) - parent_id points to EA
 * Level 3: RMA (Risk Management Authority) - parent_id points to PSO
 *
 * RFCC codes are stored in PSO's sub_type field
 * - For PSO areas: Use sub_type directly
 * - For RMA areas: Find parent PSO, then use parent's sub_type
 */

/**
 * Build a lookup map of all areas by ID for easy access
 * @param {Object} areasData - Grouped areas data from cache
 * @returns {Object} Map of areaId -> area
 */
function buildAreaLookupMap(areasData) {
  const lookupMap = {}

  Object.keys(areasData).forEach((areaType) => {
    const areas = areasData[areaType]
    if (Array.isArray(areas)) {
      areas.forEach((area) => {
        lookupMap[String(area.id)] = area
      })
    }
  })

  return lookupMap
}

/**
 * Check if an area is a PSO type
 * @param {Object} area - The area object
 * @returns {boolean} True if area is PSO type
 */
function isPsoArea(area) {
  return area.area_type === 'PSO Area' || area.area_type === 'PSO'
}

/**
 * Get RFCC code from parent PSO area
 * @param {Object} area - The RMA area
 * @param {Object} areaLookup - Area lookup map
 * @returns {string|null} Parent PSO's RFCC code or null
 */
function getRfccFromParent(area, areaLookup) {
  if (!area.parent_id) {
    return null
  }

  const parentArea = areaLookup[String(area.parent_id)]
  if (!parentArea || !isPsoArea(parentArea)) {
    return null
  }

  return parentArea.sub_type || null
}

/**
 * Get RFCC code from area data based on area type
 * - PSO areas: Return sub_type directly (contains RFCC code)
 * - RMA areas: Find parent PSO area, return parent's sub_type
 * - EA areas: Have no RFCC code
 *
 * @param {number|string} areaId - The selected area ID (rmaSelection)
 * @param {Object} areasData - Grouped areas data from cache: { 'EA': [...], 'PSO Area': [...], 'RMA': [...] }
 * @returns {string|null} RFCC code or null if not found
 */
export function getRfccCodeFromArea(areaId, areasData) {
  if (!areaId || !areasData) {
    return null
  }

  const areaLookup = buildAreaLookupMap(areasData)
  const selectedArea = areaLookup[String(areaId)]

  if (!selectedArea) {
    return null
  }

  if (isPsoArea(selectedArea)) {
    return selectedArea.sub_type || null
  }

  if (selectedArea.area_type === 'RMA') {
    return getRfccFromParent(selectedArea, areaLookup)
  }

  return null
}

/**
 * Get area name by ID from areas data
 * @param {number|string} areaId - The area ID
 * @param {Object} areasData - Grouped areas data from cache
 * @returns {string|null} Area name or null if not found
 */
export function getAreaNameById(areaId, areasData) {
  if (!areaId || !areasData) {
    return null
  }

  const areaLookup = buildAreaLookupMap(areasData)
  const areaIdStr = String(areaId)
  const area = areaLookup[areaIdStr]

  return area ? area.name : null
}

/**
 * Get full area hierarchy info (for debugging/logging)
 * @param {number|string} areaId - The area ID
 * @param {Object} areasData - Grouped areas data from cache
 * @returns {Object|null} Area hierarchy info with parent chain
 */
export function getAreaHierarchy(areaId, areasData) {
  if (!areaId || !areasData) {
    return null
  }

  const areaLookup = buildAreaLookupMap(areasData)
  const areaIdStr = String(areaId)
  const area = areaLookup[areaIdStr]

  if (!area) {
    return null
  }

  const hierarchy = {
    id: area.id,
    name: area.name,
    type: area.area_type,
    subType: area.sub_type,
    parent: null
  }

  // If has parent, add parent info
  if (area.parent_id) {
    const parentIdStr = String(area.parent_id)
    const parentArea = areaLookup[parentIdStr]
    if (parentArea) {
      hierarchy.parent = {
        id: parentArea.id,
        name: parentArea.name,
        type: parentArea.area_type,
        subType: parentArea.sub_type
      }
    }
  }

  return hierarchy
}
