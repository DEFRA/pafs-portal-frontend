import { describe, it, expect } from 'vitest'
import {
  getRfccCodeFromArea,
  getAreaNameById,
  getAreaHierarchy
} from './rfcc-helper.js'

const buildAreasData = () => ({
  EA: [{ id: '100', name: 'EA North', area_type: 'EA', parent_id: null }],
  PSO: [
    {
      id: '200',
      name: 'PSO North',
      area_type: 'PSO',
      parent_id: '100',
      sub_type: 'AN'
    },
    {
      id: '201',
      name: 'PSO Missing RFCC',
      area_type: 'PSO',
      parent_id: '100'
    }
  ],
  'PSO Area': [
    {
      id: '210',
      name: 'PSO Area East',
      area_type: 'PSO Area',
      parent_id: '100',
      sub_type: 'WX'
    }
  ],
  RMA: [
    {
      id: '300',
      name: 'RMA North',
      area_type: 'RMA',
      parent_id: '200'
    },
    {
      id: '301',
      name: 'RMA Parent Without RFCC',
      area_type: 'RMA',
      parent_id: '201'
    },
    {
      id: '302',
      name: 'RMA Orphan',
      area_type: 'RMA',
      parent_id: '999'
    }
  ]
})

describe('rfcc-helper', () => {
  describe('getRfccCodeFromArea', () => {
    it('returns RFCC code for PSO area types', () => {
      const areasData = buildAreasData()
      expect(getRfccCodeFromArea('200', areasData)).toBe('AN')
      expect(getRfccCodeFromArea('210', areasData)).toBe('WX')
    })

    it('returns parent RFCC code for RMA areas', () => {
      const areasData = buildAreasData()
      expect(getRfccCodeFromArea('300', areasData)).toBe('AN')
    })

    it('returns null when parent has no RFCC code or missing', () => {
      const areasData = buildAreasData()
      expect(getRfccCodeFromArea('301', areasData)).toBeNull()
      expect(getRfccCodeFromArea('302', areasData)).toBeNull()
    })

    it('returns null for EA or unknown areas', () => {
      const areasData = buildAreasData()
      expect(getRfccCodeFromArea('100', areasData)).toBeNull()
      expect(getRfccCodeFromArea('999', areasData)).toBeNull()
    })

    it('returns null when areaId or areasData not provided', () => {
      const areasData = buildAreasData()
      expect(getRfccCodeFromArea(null, areasData)).toBeNull()
      expect(getRfccCodeFromArea('200', null)).toBeNull()
    })
  })

  describe('getAreaNameById', () => {
    it('returns matching area name', () => {
      const areasData = buildAreasData()
      expect(getAreaNameById('200', areasData)).toBe('PSO North')
    })

    it('returns null when area not found or data missing', () => {
      const areasData = buildAreasData()
      expect(getAreaNameById('999', areasData)).toBeNull()
      expect(getAreaNameById('200', null)).toBeNull()
    })
  })

  describe('getAreaHierarchy', () => {
    it('returns hierarchy with parent details for RMA area', () => {
      const areasData = buildAreasData()
      expect(getAreaHierarchy('300', areasData)).toEqual({
        id: '300',
        name: 'RMA North',
        type: 'RMA',
        subType: undefined,
        parent: {
          id: '200',
          name: 'PSO North',
          type: 'PSO',
          subType: 'AN'
        }
      })
    })

    it('returns hierarchy for PSO area including parent when present', () => {
      const areasData = buildAreasData()
      expect(getAreaHierarchy('200', areasData)).toEqual({
        id: '200',
        name: 'PSO North',
        type: 'PSO',
        subType: 'AN',
        parent: {
          id: '100',
          name: 'EA North',
          type: 'EA',
          subType: undefined
        }
      })
    })

    it('returns null when area is missing or data absent', () => {
      const areasData = buildAreasData()
      expect(getAreaHierarchy('999', areasData)).toBeNull()
      expect(getAreaHierarchy('200', null)).toBeNull()
    })
  })
})
