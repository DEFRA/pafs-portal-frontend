/**
 * Filter areas by area type
 * @param {Array} areas - Array of area objects
 * @param {string} areaType - The area type to filter by (e.g., 'EA Area', 'PSO Area', 'RMA')
 * @returns {Array} Filtered array of areas
 */
export function filterAreasByType(areas, areaType) {
  if (!Array.isArray(areas) || !areaType) {
    return []
  }

  return areas.filter((area) => area.area_type === areaType)
}

/**
 * Filter areas by parent ID
 * @param {Array} areas - Array of area objects
 * @param {number|string} parentId - The parent ID to filter by
 * @returns {Array} Filtered array of areas
 */
export function filterAreasByParentId(areas, parentId) {
  if (!Array.isArray(areas) || parentId === undefined || parentId === null) {
    return []
  }

  // Convert parentId to number for comparison if needed
  const parentIdNum =
    typeof parentId === 'string' ? parseInt(parentId, 10) : parentId

  return areas.filter((area) => {
    const areaParentId =
      typeof area.parent_id === 'string'
        ? parseInt(area.parent_id, 10)
        : area.parent_id
    return areaParentId === parentIdNum
  })
}

/**
 * Filter areas excluding specific IDs
 * @param {Array} areas - Array of area objects
 * @param {Array<string|number>} excludeIds - Array of IDs to exclude
 * @returns {Array} Filtered array of areas
 */
export function filterAreasExcludingIds(areas, excludeIds) {
  if (!Array.isArray(areas) || !Array.isArray(excludeIds)) {
    return []
  }

  // Convert excludeIds to numbers for comparison
  const excludeIdsNum = excludeIds.map((id) =>
    typeof id === 'string' ? parseInt(id, 10) : id
  )

  return areas.filter((area) => {
    const areaId = typeof area.id === 'string' ? parseInt(area.id, 10) : area.id
    return !excludeIdsNum.includes(areaId)
  })
}

/**
 * Get area by ID
 * @param {Array} areas - Array of area objects
 * @param {string|number} areaId - The area ID to find
 * @returns {Object|null} The area object or null if not found
 */
export function getAreaById(areas, areaId) {
  if (!Array.isArray(areas) || areaId === undefined || areaId === null) {
    return null
  }

  const areaIdNum = typeof areaId === 'string' ? parseInt(areaId, 10) : areaId

  return (
    areas.find((area) => {
      const id = typeof area.id === 'string' ? parseInt(area.id, 10) : area.id
      return id === areaIdNum
    }) || null
  )
}

/**
 * Filter areas by type and exclude specific IDs
 * @param {Array} areas - Array of area objects
 * @param {string} areaType - The area type to filter by
 * @param {Array<string|number>} excludeIds - Array of IDs to exclude
 * @returns {Array} Filtered array of areas
 */
export function filterAreasByTypeExcludingIds(areas, areaType, excludeIds) {
  const filteredByType = filterAreasByType(areas, areaType)
  return filterAreasExcludingIds(filteredByType, excludeIds)
}

/**
 * Filter areas by type and parent ID
 * @param {Array} areas - Array of area objects
 * @param {string} areaType - The area type to filter by
 * @param {number|string} parentId - The parent ID to filter by
 * @returns {Array} Filtered array of areas
 */
export function filterAreasByTypeAndParent(areas, areaType, parentId) {
  const filteredByType = filterAreasByType(areas, areaType)
  return filterAreasByParentId(filteredByType, parentId)
}

/**
 * Filter areas by multiple parent IDs (returns areas where parent_id matches any of the provided IDs)
 * @param {Array} areas - Array of area objects
 * @param {Array<number|string>} parentIds - Array of parent IDs to filter by
 * @returns {Array} Filtered array of areas
 */
export function filterAreasByParentIds(areas, parentIds) {
  if (
    !Array.isArray(areas) ||
    !Array.isArray(parentIds) ||
    parentIds.length === 0
  ) {
    return []
  }

  // Convert parentIds to numbers for comparison
  const parentIdsNum = parentIds
    .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
    .filter((id) => !isNaN(id))

  return areas.filter((area) => {
    const areaParentId =
      typeof area.parent_id === 'string'
        ? parseInt(area.parent_id, 10)
        : area.parent_id
    return parentIdsNum.includes(areaParentId)
  })
}
