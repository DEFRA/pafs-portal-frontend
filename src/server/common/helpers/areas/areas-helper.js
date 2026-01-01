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
    } else if (rootTypes.includes(area.area_type)) {
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
