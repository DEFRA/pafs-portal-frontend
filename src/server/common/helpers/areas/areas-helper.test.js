import { describe, test, expect } from 'vitest'
import {
  flattenAreas,
  getAreasByType,
  getAreasExcludingCountry,
  findAreaById,
  getAreaNameById,
  getParentIdByAreaId,
  getParentArea,
  filterAndGroupByParent,
  getChildAreas,
  getAreasByTypeAndParents,
  buildAreaHierarchy,
  getAreaPath,
  hasChildren,
  getParentAreas
} from './areas-helper.js'

describe('AreasHelper', () => {
  const mockAreas = {
    EA: [
      { id: '1', name: 'Wessex', area_type: 'EA', parent_id: null },
      { id: '2', name: 'Thames', area_type: 'EA', parent_id: null }
    ],
    PSO: [
      {
        id: '3',
        name: 'PSO West of England',
        area_type: 'PSO',
        parent_id: '1'
      },
      { id: '4', name: 'PSO Dorset', area_type: 'PSO', parent_id: '1' },
      { id: '5', name: 'PSO Greater London', area_type: 'PSO', parent_id: '2' }
    ],
    RMA: [
      {
        id: '6',
        name: 'Bristol City Council',
        area_type: 'RMA',
        parent_id: '3'
      },
      { id: '7', name: 'Bath Council', area_type: 'RMA', parent_id: '3' },
      { id: '8', name: 'Dorset Council', area_type: 'RMA', parent_id: '4' },
      { id: '9', name: 'Westminster Council', area_type: 'RMA', parent_id: '5' }
    ],
    Country: [
      { id: '10', name: 'England', area_type: 'Country', parent_id: null }
    ]
  }

  describe('flattenAreas', () => {
    test('flattens grouped areas into single array', () => {
      const result = flattenAreas(mockAreas)

      expect(result).toHaveLength(10)
      expect(result).toContainEqual(mockAreas.EA[0])
      expect(result).toContainEqual(mockAreas.PSO[0])
      expect(result).toContainEqual(mockAreas.RMA[0])
    })

    test('handles empty object', () => {
      const result = flattenAreas({})
      expect(result).toEqual([])
    })

    test('handles null input', () => {
      const result = flattenAreas(null)
      expect(result).toEqual([])
    })

    test('handles undefined input', () => {
      const result = flattenAreas(undefined)
      expect(result).toEqual([])
    })
  })

  describe('getAreasByType', () => {
    test('returns EA areas', () => {
      const result = getAreasByType(mockAreas, 'EA')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Wessex')
      expect(result[1].name).toBe('Thames')
    })

    test('returns PSO areas', () => {
      const result = getAreasByType(mockAreas, 'PSO')

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('PSO West of England')
    })

    test('returns RMA areas', () => {
      const result = getAreasByType(mockAreas, 'RMA')

      expect(result).toHaveLength(4)
      expect(result[0].name).toBe('Bristol City Council')
    })

    test('returns empty array for non-existent type', () => {
      const result = getAreasByType(mockAreas, 'INVALID')
      expect(result).toEqual([])
    })

    test('handles null areas', () => {
      const result = getAreasByType(null, 'EA')
      expect(result).toEqual([])
    })

    test('handles null type', () => {
      const result = getAreasByType(mockAreas, null)
      expect(result).toEqual([])
    })
  })

  describe('getAreasExcludingCountry', () => {
    test('excludes Country type', () => {
      const result = getAreasExcludingCountry(mockAreas)

      expect(result.EA).toBeDefined()
      expect(result.PSO).toBeDefined()
      expect(result.RMA).toBeDefined()
      expect(result.Country).toBeUndefined()
    })

    test('excludes Authority type', () => {
      const areasWithAuthority = {
        ...mockAreas,
        Authority: [
          { id: '11', name: 'Test Authority', area_type: 'Authority' }
        ]
      }

      const result = getAreasExcludingCountry(areasWithAuthority)

      expect(result.Authority).toBeUndefined()
      expect(result.EA).toBeDefined()
    })

    test('handles empty object', () => {
      const result = getAreasExcludingCountry({})
      expect(result).toEqual({})
    })

    test('handles null input', () => {
      const result = getAreasExcludingCountry(null)
      expect(result).toEqual({})
    })
  })

  describe('findAreaById', () => {
    test('finds EA area by id', () => {
      const result = findAreaById(mockAreas, '1')

      expect(result).toBeDefined()
      expect(result.name).toBe('Wessex')
      expect(result.area_type).toBe('EA')
    })

    test('finds PSO area by id', () => {
      const result = findAreaById(mockAreas, '3')

      expect(result).toBeDefined()
      expect(result.name).toBe('PSO West of England')
    })

    test('finds RMA area by id', () => {
      const result = findAreaById(mockAreas, '6')

      expect(result).toBeDefined()
      expect(result.name).toBe('Bristol City Council')
    })

    test('returns null for non-existent id', () => {
      const result = findAreaById(mockAreas, '999')
      expect(result).toBeNull()
    })

    test('handles null areas', () => {
      const result = findAreaById(null, '1')
      expect(result).toBeNull()
    })

    test('handles null id', () => {
      const result = findAreaById(mockAreas, null)
      expect(result).toBeNull()
    })

    test('handles numeric id by converting to string', () => {
      const result = findAreaById(mockAreas, 1)
      expect(result).toBeDefined()
      expect(result.name).toBe('Wessex')
    })
  })

  describe('getAreaNameById', () => {
    test('returns area name', () => {
      const result = getAreaNameById(mockAreas, '1')
      expect(result).toBe('Wessex')
    })

    test('returns null for non-existent id', () => {
      const result = getAreaNameById(mockAreas, '999')
      expect(result).toBeNull()
    })

    test('handles null areas', () => {
      const result = getAreaNameById(null, '1')
      expect(result).toBeNull()
    })
  })

  describe('getParentIdByAreaId', () => {
    test('returns parent id for PSO area', () => {
      const result = getParentIdByAreaId(mockAreas, '3')
      expect(result).toBe('1')
    })

    test('returns parent id for RMA area', () => {
      const result = getParentIdByAreaId(mockAreas, '6')
      expect(result).toBe('3')
    })

    test('returns null for EA area (no parent)', () => {
      const result = getParentIdByAreaId(mockAreas, '1')
      expect(result).toBeNull()
    })

    test('returns null for non-existent id', () => {
      const result = getParentIdByAreaId(mockAreas, '999')
      expect(result).toBeNull()
    })
  })

  describe('getParentArea', () => {
    test('returns parent EA area for PSO', () => {
      const result = getParentArea(mockAreas, '3')

      expect(result).toBeDefined()
      expect(result.name).toBe('Wessex')
      expect(result.area_type).toBe('EA')
    })

    test('returns parent PSO area for RMA', () => {
      const result = getParentArea(mockAreas, '6')

      expect(result).toBeDefined()
      expect(result.name).toBe('PSO West of England')
      expect(result.area_type).toBe('PSO')
    })

    test('returns null for EA area (no parent)', () => {
      const result = getParentArea(mockAreas, '1')
      expect(result).toBeNull()
    })

    test('returns null for non-existent id', () => {
      const result = getParentArea(mockAreas, '999')
      expect(result).toBeNull()
    })
  })

  describe('getParentAreas', () => {
    test('returns empty array when inputs missing', () => {
      expect(getParentAreas(null, null, null)).toEqual([])
      expect(getParentAreas(mockAreas, null, 'EA')).toEqual([])
      expect(getParentAreas(mockAreas, '6', null)).toEqual([])
    })

    test('returns immediate parent of target type (PSO for RMA)', () => {
      const parents = getParentAreas(mockAreas, '6', 'PSO')
      expect(parents).toHaveLength(1)
      expect(parents[0].id).toBe('3')
    })

    test('includes the area itself if it matches the target type', () => {
      const parents = getParentAreas(mockAreas, '3', 'PSO')
      expect(parents).toHaveLength(1)
      expect(parents[0].id).toBe('3')
    })

    test('returns ancestor higher up the chain when requested (EA for RMA)', () => {
      const parents = getParentAreas(mockAreas, '6', 'EA')
      expect(parents).toHaveLength(1)
      expect(parents[0].id).toBe('1')
    })

    test('returns empty when no matching parent type exists', () => {
      const parents = getParentAreas(mockAreas, '1', 'PSO')
      expect(parents).toEqual([])
    })
  })

  describe('filterAndGroupByParent', () => {
    test('groups PSO areas by EA parent', () => {
      const result = filterAndGroupByParent(mockAreas, ['1', '2'])

      expect(result['1']).toHaveLength(2)
      expect(result['1'][0].name).toBe('PSO West of England')
      expect(result['1'][1].name).toBe('PSO Dorset')
      expect(result['2']).toHaveLength(1)
      expect(result['2'][0].name).toBe('PSO Greater London')
    })

    test('filters by single parent', () => {
      const result = filterAndGroupByParent(mockAreas, ['1'])

      expect(result['1']).toHaveLength(2)
      expect(result['2']).toBeUndefined()
    })

    test('excludes areas whose parent has a parent', () => {
      const result = filterAndGroupByParent(mockAreas, ['3'])

      expect(result['3']).toBeUndefined()
    })

    test('handles empty parent ids', () => {
      const result = filterAndGroupByParent(mockAreas, [])
      expect(result).toEqual({})
    })

    test('handles null areas', () => {
      const result = filterAndGroupByParent(null, ['1'])
      expect(result).toEqual({})
    })

    test('handles null parent ids', () => {
      const result = filterAndGroupByParent(mockAreas, null)
      expect(result).toEqual({})
    })
  })

  describe('getChildAreas', () => {
    test('returns PSO children of EA area', () => {
      const result = getChildAreas(mockAreas, '1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('PSO West of England')
      expect(result[1].name).toBe('PSO Dorset')
    })

    test('returns RMA children of PSO area', () => {
      const result = getChildAreas(mockAreas, '3')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Bristol City Council')
      expect(result[1].name).toBe('Bath Council')
    })

    test('returns empty array for area with no children', () => {
      const result = getChildAreas(mockAreas, '6')
      expect(result).toEqual([])
    })

    test('handles null areas', () => {
      const result = getChildAreas(null, '1')
      expect(result).toEqual([])
    })

    test('handles null parent id', () => {
      const result = getChildAreas(mockAreas, null)
      expect(result).toEqual([])
    })
  })

  describe('getAreasByTypeAndParents', () => {
    test('returns PSO areas for specific EA parents', () => {
      const result = getAreasByTypeAndParents(mockAreas, 'PSO', ['1'])

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('PSO West of England')
      expect(result[1].name).toBe('PSO Dorset')
    })

    test('returns RMA areas for specific PSO parents', () => {
      const result = getAreasByTypeAndParents(mockAreas, 'RMA', ['3', '4'])

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Bristol City Council')
      expect(result[1].name).toBe('Bath Council')
      expect(result[2].name).toBe('Dorset Council')
    })

    test('returns all areas of type when parent ids empty', () => {
      const result = getAreasByTypeAndParents(mockAreas, 'PSO', [])

      expect(result).toHaveLength(3)
    })

    test('handles null areas', () => {
      const result = getAreasByTypeAndParents(null, 'PSO', ['1'])
      expect(result).toEqual([])
    })

    test('handles null type', () => {
      const result = getAreasByTypeAndParents(mockAreas, null, ['1'])
      expect(result).toEqual([])
    })

    test('handles null parent ids', () => {
      const result = getAreasByTypeAndParents(mockAreas, 'PSO', null)
      expect(result).toEqual([])
    })
  })

  describe('buildAreaHierarchy', () => {
    test('builds hierarchy tree from EA roots', () => {
      const result = buildAreaHierarchy(mockAreas, ['EA'])

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Wessex')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].name).toBe('PSO West of England')
      expect(result[0].children[0].children).toHaveLength(2)
      expect(result[0].children[0].children[0].name).toBe(
        'Bristol City Council'
      )
    })

    test('builds hierarchy with multiple root types', () => {
      const result = buildAreaHierarchy(mockAreas, ['EA', 'Country'])

      expect(result.length).toBeGreaterThanOrEqual(2)
    })

    test('handles null areas', () => {
      const result = buildAreaHierarchy(null, ['EA'])
      expect(result).toEqual([])
    })

    test('handles empty root types', () => {
      const result = buildAreaHierarchy(mockAreas, [])
      expect(result).toEqual([])
    })
  })

  describe('getAreaPath', () => {
    test('returns full path for RMA area', () => {
      const result = getAreaPath(mockAreas, '6')
      expect(result).toBe('Wessex > PSO West of England > Bristol City Council')
    })

    test('returns path for PSO area', () => {
      const result = getAreaPath(mockAreas, '3')
      expect(result).toBe('Wessex > PSO West of England')
    })

    test('returns single name for EA area', () => {
      const result = getAreaPath(mockAreas, '1')
      expect(result).toBe('Wessex')
    })

    test('uses custom separator', () => {
      const result = getAreaPath(mockAreas, '6', ' / ')
      expect(result).toBe('Wessex / PSO West of England / Bristol City Council')
    })

    test('handles non-existent id', () => {
      const result = getAreaPath(mockAreas, '999')
      expect(result).toBe('')
    })
  })

  describe('hasChildren', () => {
    test('returns true for EA area with PSO children', () => {
      const result = hasChildren(mockAreas, '1')
      expect(result).toBe(true)
    })

    test('returns true for PSO area with RMA children', () => {
      const result = hasChildren(mockAreas, '3')
      expect(result).toBe(true)
    })

    test('returns false for RMA area with no children', () => {
      const result = hasChildren(mockAreas, '6')
      expect(result).toBe(false)
    })

    test('returns false for non-existent id', () => {
      const result = hasChildren(mockAreas, '999')
      expect(result).toBe(false)
    })
  })

  describe('Account Request Flow - Real World Scenarios', () => {
    test('EA user selects main EA area', () => {
      const eaAreas = getAreasByType(mockAreas, 'EA')

      expect(eaAreas).toHaveLength(2)
      expect(eaAreas[0].name).toBe('Wessex')
      expect(eaAreas[1].name).toBe('Thames')
    })

    test('EA user selects additional EA areas (checkboxes)', () => {
      const eaAreas = getAreasByType(mockAreas, 'EA')
      const selectedIds = ['1', '2']
      expect(eaAreas).toHaveLength(2)

      const selectedAreas = selectedIds.map((id) => findAreaById(mockAreas, id))

      expect(selectedAreas).toHaveLength(2)
      expect(selectedAreas[0].name).toBe('Wessex')
      expect(selectedAreas[1].name).toBe('Thames')
    })

    test('PSO user selects EA areas they work with', () => {
      const eaAreas = getAreasByType(mockAreas, 'EA')
      const selectedEaIds = ['1']

      expect(eaAreas).toHaveLength(2)
      expect(selectedEaIds).toContain('1')
    })

    test('PSO user selects PSO areas within selected EA areas', () => {
      const selectedEaIds = ['1']
      const psoAreas = getAreasByTypeAndParents(mockAreas, 'PSO', selectedEaIds)

      expect(psoAreas).toHaveLength(2)
      expect(psoAreas[0].name).toBe('PSO West of England')
      expect(psoAreas[1].name).toBe('PSO Dorset')
      expect(psoAreas[0].parent_id).toBe('1')
    })

    test('PSO user selects main PSO area from filtered list', () => {
      const selectedEaIds = ['1']
      const psoAreas = getAreasByTypeAndParents(mockAreas, 'PSO', selectedEaIds)
      const mainPsoId = '3'

      const mainPso = findAreaById(mockAreas, mainPsoId)

      expect(psoAreas).toContain(mainPso)
      expect(mainPso.name).toBe('PSO West of England')
    })

    test('RMA user selects EA areas', () => {
      const eaAreas = getAreasByType(mockAreas, 'EA')
      const selectedEaIds = ['1', '2']

      expect(eaAreas).toHaveLength(2)
      expect(selectedEaIds).toHaveLength(2)
    })

    test('RMA user sees PSO areas grouped by EA', () => {
      const selectedEaIds = ['1', '2']
      const psosByEa = filterAndGroupByParent(mockAreas, selectedEaIds)

      expect(psosByEa['1']).toHaveLength(2)
      expect(psosByEa['2']).toHaveLength(1)
      expect(psosByEa['1'][0].name).toBe('PSO West of England')
      expect(psosByEa['2'][0].name).toBe('PSO Greater London')
    })

    test('RMA user selects PSO areas (checkboxes)', () => {
      const selectedEaIds = ['1']
      const psoAreas = getAreasByTypeAndParents(mockAreas, 'PSO', selectedEaIds)
      const selectedPsoIds = ['3', '4']

      const selectedPsos = selectedPsoIds.map((id) =>
        findAreaById(mockAreas, id)
      )

      expect(selectedPsos).toHaveLength(2)
      expect(selectedPsos.every((pso) => psoAreas.includes(pso))).toBe(true)
    })

    test('RMA user selects main RMA area from filtered list', () => {
      const selectedPsoIds = ['3', '4']
      const rmaAreas = getAreasByTypeAndParents(
        mockAreas,
        'RMA',
        selectedPsoIds
      )

      expect(rmaAreas).toHaveLength(3)
      expect(rmaAreas[0].name).toBe('Bristol City Council')
      expect(rmaAreas[1].name).toBe('Bath Council')
      expect(rmaAreas[2].name).toBe('Dorset Council')
    })

    test('Display area breadcrumb on summary page', () => {
      const rmaId = '6'
      const breadcrumb = getAreaPath(mockAreas, rmaId)

      expect(breadcrumb).toBe(
        'Wessex > PSO West of England > Bristol City Council'
      )
    })

    test('Display area name in user list', () => {
      const areaId = '6'
      const areaName = getAreaNameById(mockAreas, areaId)

      expect(areaName).toBe('Bristol City Council')
    })

    test('Check if area has sub-areas for conditional rendering', () => {
      const eaId = '1'
      const hasSubAreas = hasChildren(mockAreas, eaId)

      expect(hasSubAreas).toBe(true)
    })

    test('Filter areas excluding country level', () => {
      const filteredAreas = getAreasExcludingCountry(mockAreas)

      expect(filteredAreas.Country).toBeUndefined()
      expect(filteredAreas.EA).toBeDefined()
      expect(filteredAreas.PSO).toBeDefined()
      expect(filteredAreas.RMA).toBeDefined()
    })

    test('Get parent EA for PSO area display', () => {
      const psoId = '3'
      const parentEa = getParentArea(mockAreas, psoId)

      expect(parentEa.name).toBe('Wessex')
      expect(parentEa.area_type).toBe('EA')
    })

    test('Build full hierarchy for nested select display', () => {
      const hierarchy = buildAreaHierarchy(mockAreas, ['EA'])

      expect(hierarchy[0].name).toBe('Wessex')
      expect(hierarchy[0].children[0].name).toBe('PSO West of England')
      expect(hierarchy[0].children[0].children[0].name).toBe(
        'Bristol City Council'
      )
    })
  })
})
