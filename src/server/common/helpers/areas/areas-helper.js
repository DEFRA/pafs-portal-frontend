/**
 * Areas Helper Utility
 * Provides filtering and lookup functions for area data
 *
 * Area Hierarchy:
 * - Country (ignored in most operations)
 * - EA (Environment Agency) Areas
 * - PSO (Partnership and Strategic Overview) Areas (children of EA)
 * - RMA (Risk Management Authority) Areas (children of PSO)
 */

import { AREAS_RESPONSIBILITIES_MAP } from '../../constants/common.js'

export function flattenAreas(areasByType) {
  if (!areasByType || typeof areasByType !== 'object') {
    return []
  }

  return Object.values(areasByType).flat()
}

export function getAreasByType(areasByType, type) {
  if (!areasByType || !type) {
    return []
  }

  return areasByType[type] || []
}

export function getAreasExcludingCountry(areasByType) {
  if (!areasByType || typeof areasByType !== 'object') {
    return {}
  }

  const { Country, Authority, ...restAllAreasByType } = areasByType
  return restAllAreasByType
}

export function findAreaById(areasByType, id) {
  if (!areasByType || !id) {
    return null
  }

  const allAreas = flattenAreas(areasByType)
  return allAreas.find((area) => area.id === id.toString()) || null
}

export function getAreaNameById(areasByType, id) {
  const area = findAreaById(areasByType, id)
  return area ? area.name : null
}

export function getParentIdByAreaId(areasByType, id) {
  const area = findAreaById(areasByType, id)
  return area?.parent_id ?? null
}

export function getParentArea(areasByType, id) {
  const parentId = getParentIdByAreaId(areasByType, id)
  return parentId ? findAreaById(areasByType, parentId) : null
}

export function filterAndGroupByParent(areasByType, parentIds) {
  if (!areasByType || !Array.isArray(parentIds) || parentIds.length === 0) {
    return {}
  }

  const allAreas = flattenAreas(areasByType)
  const grouped = {}

  parentIds.forEach((parentId) => {
    const parent = findAreaById(areasByType, parentId)

    // Only process if parent exists and doesn't have a parent itself
    if (parent && !parent.parent_id) {
      const children = allAreas.filter(
        (area) => area.parent_id === parentId.toString()
      )

      if (children.length > 0) {
        grouped[parentId] = children
      }
    }
  })

  return grouped
}

export function getChildAreas(areasByType, parentId) {
  if (!areasByType || !parentId) {
    return []
  }

  const allAreas = flattenAreas(areasByType)
  return allAreas.filter((area) => area.parent_id === parentId.toString())
}

export function getAreasByTypeAndParents(areasByType, type, parentIds) {
  if (!areasByType || !type || !Array.isArray(parentIds)) {
    return []
  }

  const areasOfType = getAreasByType(areasByType, type)

  if (parentIds.length === 0) {
    return areasOfType
  }

  return areasOfType.filter((area) =>
    parentIds.includes(area.parent_id?.toString())
  )
}

export function buildAreaHierarchy(areasByType, rootTypes = ['EA']) {
  if (!areasByType) {
    return []
  }

  const allAreas = flattenAreas(areasByType)
  const areaMap = new Map(
    allAreas.map((area) => [area.id, { ...area, children: [] }])
  )

  // Build tree structure
  const roots = []
  areaMap.forEach((area) => {
    if (area.parent_id) {
      const parent = areaMap.get(area.parent_id)
      if (parent) {
        parent.children.push(area)
      }
      return
    }

    if (rootTypes.includes(area.area_type)) {
      roots.push(area)
    }
  })

  return roots
}

export function getAreaPath(areasByType, id, separator = ' > ') {
  const path = []
  let currentId = id

  while (currentId) {
    const area = findAreaById(areasByType, currentId)
    if (!area) {
      break
    }

    path.unshift(area.name)
    currentId = area.parent_id
  }

  return path.join(separator)
}

export function hasChildren(areasByType, id) {
  const children = getChildAreas(areasByType, id)
  return children.length > 0
}

/**
 * Get all parent areas of a specific type for a given area
 * Traverses up the hierarchy to find all ancestors of the target type
 * @param {Object} areasByType - The areas data structure
 * @param {string} areaId - The ID of the area to find parents for
 * @param {string} targetType - The type of parents to find (EA, PSO, RMA)
 * @returns {Array} Array of parent areas of the specified type
 */
export function getParentAreas(areasByType, areaId, targetType) {
  if (!areasByType || !areaId || !targetType) {
    return []
  }

  const parents = []
  let currentArea = findAreaById(areasByType, areaId)

  // Traverse up the hierarchy
  while (currentArea) {
    if (currentArea.area_type === targetType) {
      parents.push(currentArea)
    }

    // Move to parent
    if (currentArea.parent_id) {
      currentArea = findAreaById(areasByType, currentArea.parent_id)
    } else {
      break
    }
  }

  return parents
}

/**
 * Get area details for display (main area and additional areas)
 * @param {Object} areasByType - The areas data structure
 * @param {Array} userAreas - Array of user area objects with areaId and primary fields
 * @returns {Object} Object with mainArea and additionalAreas
 */
export function getAreaDetails(areasByType, userAreas) {
  if (!userAreas || userAreas.length === 0) {
    return {
      mainArea: null,
      additionalAreas: []
    }
  }

  const mainAreaObj = userAreas.find((a) => a.primary)
  const mainAreaDetails = mainAreaObj
    ? findAreaById(areasByType, mainAreaObj.areaId)
    : null

  const additionalAreasObjs = userAreas
    .filter((a) => !a.primary)
    .map((a) => findAreaById(areasByType, a.areaId))
    .filter(Boolean)

  return {
    mainArea: mainAreaDetails,
    additionalAreas: additionalAreasObjs
  }
}

/**
 * Determine user responsibility from their primary area type
 * @param {Object} account - Account object with areas array
 * @param {Object} areasByType - The areas data structure
 * @param {Object} responsibilityMap - Map of responsibility constants (EA, PSO, RMA)
 * @param {Object} areasResponsibilitiesMap - Map of area type constants (EA Area, PSO Area, RMA)
 * @returns {string|null} Responsibility type or null
 */
export function determineResponsibilityFromAreas(
  account,
  areasByType,
  responsibilityMap,
  areasResponsibilitiesMap
) {
  if (account.admin || !account.areas || account.areas.length === 0) {
    return null
  }

  const primaryArea = account.areas.find((a) => a.primary)
  if (!primaryArea) {
    return null
  }

  // Look up the area in the cached areas data to get the area_type
  const areaDetails = findAreaById(areasByType, primaryArea.id)
  if (!areaDetails?.area_type) {
    return null
  }

  // Map area_type to responsibility using AREAS_RESPONSIBILITIES_MAP
  // area_type values: "EA Area", "PSO Area", "RMA"
  const areaTypeToResponsibility = {
    [areasResponsibilitiesMap.EA]: responsibilityMap.EA,
    [areasResponsibilitiesMap.PSO]: responsibilityMap.PSO,
    [areasResponsibilitiesMap.RMA]: responsibilityMap.RMA
  }

  return areaTypeToResponsibility[areaDetails.area_type] || null
}

/**
 * Get parent areas display for user based on their responsibility
 * @param {Object} areasByType - The areas data structure
 * @param {string} responsibility - User's responsibility (EA, PSO, RMA)
 * @param {Array} userAreas - Array of user area objects with areaId and primary fields
 * @param {Object} responsibilityMap - Map of responsibility constants
 * @param {Object} areasResponsibilitiesMap - Map of area type constants
 * @returns {Object|null} Object with eaAreas and psoAreas strings, or null
 */
export function getParentAreasDisplay(
  areasByType,
  responsibility,
  userAreas,
  responsibilityMap,
  areasResponsibilitiesMap
) {
  if (!responsibility || !userAreas || userAreas.length === 0) {
    return null
  }

  // Get unique parent areas based on responsibility
  const parentAreasSet = new Set()

  userAreas.forEach((areaObj) => {
    const area = findAreaById(areasByType, areaObj.areaId)
    if (!area) {
      return
    }

    // For PSO users, get EA parents
    if (responsibility === responsibilityMap.PSO) {
      const eaParents = getParentAreas(
        areasByType,
        area.id,
        areasResponsibilitiesMap.EA
      )
      eaParents.forEach((parent) =>
        parentAreasSet.add(JSON.stringify({ type: 'EA', area: parent }))
      )
    }
    if (responsibility === responsibilityMap.RMA) {
      // For RMA users, get both EA and PSO parents
      const eaParents = getParentAreas(
        areasByType,
        area.id,
        areasResponsibilitiesMap.EA
      )
      eaParents.forEach((parent) =>
        parentAreasSet.add(JSON.stringify({ type: 'EA', area: parent }))
      )

      const psoParents = getParentAreas(
        areasByType,
        area.id,
        areasResponsibilitiesMap.PSO
      )
      psoParents.forEach((parent) =>
        parentAreasSet.add(JSON.stringify({ type: 'PSO', area: parent }))
      )
    }
    // EA users or other responsibilities don't need parent areas
  })

  // Convert back to objects and group by type
  const parentAreas = Array.from(parentAreasSet).map((str) => JSON.parse(str))
  const eaAreas = parentAreas
    .filter((p) => p.type === 'EA')
    .map((p) => p.area.name)
  const psoAreas = parentAreas
    .filter((p) => p.type === 'PSO')
    .map((p) => p.area.name)

  return {
    eaAreas: eaAreas.length > 0 ? eaAreas.join(', ') : null,
    psoAreas: psoAreas.length > 0 ? psoAreas.join(', ') : null
  }
}

/**
 * Build dropdown options from areas of a specific type
 * @param {Object} areasData - Areas grouped by type
 * @param {string} type - Area type to filter by
 * @param {string} textColumn - Area object property to use for display text
 * @param {string} idColumn - Area object property to use for value
 * @param {string} emptyText - Text for empty/default option
 * @returns {Array} Array of dropdown items with {value, text} format
 */
export function buildAreaDropdownByType({
  areasData,
  type,
  textColumn = 'name',
  idColumn = 'id',
  emptyText = 'Select an option'
}) {
  const areas = getAreasByType(areasData, type)

  const items = [{ value: '', text: emptyText }]

  if (areas && areas.length > 0) {
    areas.forEach((area) => {
      items.push({
        value: area[idColumn].toString(),
        text: area[textColumn]
      })
    })
  }

  return items
}

/**
 * Build dropdown options from unique RFCC codes (sub_type) in PSO areas
 * @param {Object} areasData - Areas grouped by type
 * @param {string} emptyText - Text for empty/default option
 * @returns {Array} Array of dropdown items with {value, text} format
 */
export function buildRfccCodeDropdown({
  areasData,
  emptyText = 'Select a RFCC code'
}) {
  const psoAreas = getAreasByType(areasData, AREAS_RESPONSIBILITIES_MAP.PSO)

  const items = [{ value: '', text: emptyText }]

  if (psoAreas && psoAreas.length > 0) {
    // Extract unique sub_type values
    const uniqueRfccCodes = new Set()

    psoAreas.forEach((area) => {
      if (area.sub_type && area.sub_type.trim() !== '') {
        uniqueRfccCodes.add(area.sub_type.trim())
      }
    })

    // Convert to sorted array and build dropdown items
    const sortedCodes = Array.from(uniqueRfccCodes).sort((a, b) =>
      a.localeCompare(b)
    )

    sortedCodes.forEach((code) => {
      items.push({
        value: code,
        text: code
      })
    })
  }

  return items
}
