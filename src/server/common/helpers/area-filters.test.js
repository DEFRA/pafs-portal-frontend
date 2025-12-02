import {
  filterAreasByType,
  filterAreasByParentId,
  filterAreasExcludingIds,
  getAreaById,
  filterAreasByTypeExcludingIds,
  filterAreasByTypeAndParent,
  filterAreasByParentIds
} from './area-filters.js'

describe('#area-filters', () => {
  const mockAreas = [
    { id: 1, name: 'Thames', area_type: 'EA Area', parent_id: null },
    { id: 2, name: 'Anglian', area_type: 'EA Area', parent_id: null },
    { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
    { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 },
    { id: 12, name: 'PSO Team 3', area_type: 'PSO Area', parent_id: 2 },
    { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 },
    { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 },
    { id: 22, name: 'RMA 3', area_type: 'RMA', parent_id: 11 }
  ]

  describe('filterAreasByType', () => {
    test('Should filter areas by type', () => {
      const result = filterAreasByType(mockAreas, 'EA Area')
      expect(result).toHaveLength(2)
      expect(result[0].area_type).toBe('EA Area')
      expect(result[1].area_type).toBe('EA Area')
    })

    test('Should return empty array for non-existent type', () => {
      const result = filterAreasByType(mockAreas, 'NonExistent')
      expect(result).toEqual([])
    })

    test('Should return empty array for invalid input', () => {
      expect(filterAreasByType(null, 'EA Area')).toEqual([])
      expect(filterAreasByType([], 'EA Area')).toEqual([])
      expect(filterAreasByType(mockAreas, null)).toEqual([])
    })
  })

  describe('filterAreasByParentId', () => {
    test('Should filter areas by parent ID', () => {
      const result = filterAreasByParentId(mockAreas, 1)
      expect(result).toHaveLength(2)
      expect(result[0].parent_id).toBe(1)
      expect(result[1].parent_id).toBe(1)
    })

    test('Should handle string parent ID', () => {
      const result = filterAreasByParentId(mockAreas, '1')
      expect(result).toHaveLength(2)
    })

    test('Should return empty array for non-existent parent ID', () => {
      const result = filterAreasByParentId(mockAreas, 999)
      expect(result).toEqual([])
    })

    test('Should return empty array for invalid input', () => {
      expect(filterAreasByParentId(null, 1)).toEqual([])
      expect(filterAreasByParentId([], 1)).toEqual([])
      expect(filterAreasByParentId(mockAreas, null)).toEqual([])
      expect(filterAreasByParentId(mockAreas, undefined)).toEqual([])
    })
  })

  describe('filterAreasExcludingIds', () => {
    test('Should exclude specified IDs', () => {
      const result = filterAreasExcludingIds(mockAreas, [1, 2])
      expect(result).toHaveLength(6)
      expect(result.find((a) => a.id === 1)).toBeUndefined()
      expect(result.find((a) => a.id === 2)).toBeUndefined()
    })

    test('Should handle string IDs', () => {
      const result = filterAreasExcludingIds(mockAreas, ['1', '2'])
      expect(result).toHaveLength(6)
    })

    test('Should return all areas when exclude list is empty', () => {
      const result = filterAreasExcludingIds(mockAreas, [])
      expect(result).toHaveLength(mockAreas.length)
    })

    test('Should return empty array for invalid input', () => {
      expect(filterAreasExcludingIds(null, [1])).toEqual([])
      expect(filterAreasExcludingIds([], [1])).toEqual([])
      expect(filterAreasExcludingIds(mockAreas, null)).toEqual([])
    })
  })

  describe('getAreaById', () => {
    test('Should return area by ID', () => {
      const result = getAreaById(mockAreas, 1)
      expect(result).toEqual(mockAreas[0])
    })

    test('Should handle string ID', () => {
      const result = getAreaById(mockAreas, '1')
      expect(result).toEqual(mockAreas[0])
    })

    test('Should return null for non-existent ID', () => {
      const result = getAreaById(mockAreas, 999)
      expect(result).toBeNull()
    })

    test('Should return null for invalid input', () => {
      expect(getAreaById(null, 1)).toBeNull()
      expect(getAreaById([], 1)).toBeNull()
      expect(getAreaById(mockAreas, null)).toBeNull()
      expect(getAreaById(mockAreas, undefined)).toBeNull()
    })
  })

  describe('filterAreasByTypeExcludingIds', () => {
    test('Should filter by type and exclude IDs', () => {
      const result = filterAreasByTypeExcludingIds(mockAreas, 'PSO Area', [10])
      expect(result).toHaveLength(2)
      expect(result[0].area_type).toBe('PSO Area')
      expect(result.find((a) => a.id === 10)).toBeUndefined()
    })

    test('Should return empty array when all filtered areas are excluded', () => {
      const result = filterAreasByTypeExcludingIds(mockAreas, 'EA Area', [1, 2])
      expect(result).toEqual([])
    })
  })

  describe('filterAreasByTypeAndParent', () => {
    test('Should filter by type and parent ID', () => {
      const result = filterAreasByTypeAndParent(mockAreas, 'PSO Area', 1)
      expect(result).toHaveLength(2)
      expect(result[0].area_type).toBe('PSO Area')
      expect(result[0].parent_id).toBe(1)
    })

    test('Should return empty array when no matches', () => {
      const result = filterAreasByTypeAndParent(mockAreas, 'PSO Area', 999)
      expect(result).toEqual([])
    })
  })

  describe('filterAreasByParentIds', () => {
    test('Should filter areas by multiple parent IDs', () => {
      const result = filterAreasByParentIds(mockAreas, [1, 2])
      expect(result).toHaveLength(3)
      expect(result.every((a) => a.parent_id === 1 || a.parent_id === 2)).toBe(
        true
      )
    })

    test('Should handle string parent IDs', () => {
      const result = filterAreasByParentIds(mockAreas, ['1', '2'])
      expect(result).toHaveLength(3)
    })

    test('Should return empty array for empty parent IDs', () => {
      const result = filterAreasByParentIds(mockAreas, [])
      expect(result).toEqual([])
    })

    test('Should return empty array for invalid input', () => {
      expect(filterAreasByParentIds(null, [1])).toEqual([])
      expect(filterAreasByParentIds([], [1])).toEqual([])
      expect(filterAreasByParentIds(mockAreas, null)).toEqual([])
    })

    test('Should filter out invalid parent IDs', () => {
      const result = filterAreasByParentIds(mockAreas, [1, 'invalid', 2])
      expect(result).toHaveLength(3)
    })
  })
})
