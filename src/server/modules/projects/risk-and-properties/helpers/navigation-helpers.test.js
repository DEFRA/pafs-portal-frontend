import { describe, it, expect } from 'vitest'
import {
  replaceReferenceNumber,
  shouldSkipMainRisk,
  shouldSkipPropertyAffectedFlooding,
  shouldShowPropertyAffectedCoastalErosion,
  shouldShowCurrentFloodRisk,
  shouldShowCurrentFloodSurfaceWaterRisk,
  shouldShowCurrentCoastalErosionRisk,
  getPropertyAffectedFloodingBackLink,
  getPropertyAffectedCoastalErosionBackLink,
  getTwentyPercentDeprivedBackLink,
  getCurrentFloodSurfaceWaterRiskBackLink,
  getCurrentCoastalErosionRiskBackLink,
  getNextStepAfterFortyPercent,
  getNextStepAfterCurrentFloodRisk,
  getNextStepAfterCurrentSurfaceWaterRisk,
  getDynamicBackLink
} from './navigation-helpers.js'
import {
  PROJECT_RISK_TYPES,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'

describe('navigation-helpers', () => {
  describe('replaceReferenceNumber', () => {
    it('should replace placeholder with reference number', () => {
      const route = '/project/{referenceNumber}/edit'
      const referenceNumber = 'ABC123'
      const result = replaceReferenceNumber(route, referenceNumber)
      expect(result).toBe('/project/ABC123/edit')
    })
  })

  describe('shouldSkipMainRisk', () => {
    it('should return true when only one risk selected', () => {
      expect(shouldSkipMainRisk([PROJECT_RISK_TYPES.FLUVIAL])).toBe(true)
    })

    it('should return false when multiple risks selected', () => {
      expect(
        shouldSkipMainRisk([
          PROJECT_RISK_TYPES.FLUVIAL,
          PROJECT_RISK_TYPES.TIDAL
        ])
      ).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(shouldSkipMainRisk([])).toBe(false)
      expect(shouldSkipMainRisk(null)).toBe(false)
      expect(shouldSkipMainRisk(undefined)).toBe(false)
    })
  })

  describe('shouldSkipPropertyAffectedFlooding', () => {
    it('should return true when only coastal erosion is selected', () => {
      expect(
        shouldSkipPropertyAffectedFlooding(PROJECT_RISK_TYPES.COASTAL_EROSION, [
          PROJECT_RISK_TYPES.COASTAL_EROSION
        ])
      ).toBe(true)
    })

    it('should return false when coastal erosion and other risks selected', () => {
      expect(
        shouldSkipPropertyAffectedFlooding(PROJECT_RISK_TYPES.COASTAL_EROSION, [
          PROJECT_RISK_TYPES.COASTAL_EROSION,
          PROJECT_RISK_TYPES.FLUVIAL
        ])
      ).toBe(false)
    })

    it('should return false when main risk is not coastal erosion', () => {
      expect(
        shouldSkipPropertyAffectedFlooding(PROJECT_RISK_TYPES.FLUVIAL, [
          PROJECT_RISK_TYPES.FLUVIAL
        ])
      ).toBe(false)
    })
  })

  describe('shouldShowPropertyAffectedCoastalErosion', () => {
    it('should return true when coastal erosion is in risks', () => {
      expect(
        shouldShowPropertyAffectedCoastalErosion([
          PROJECT_RISK_TYPES.FLUVIAL,
          PROJECT_RISK_TYPES.COASTAL_EROSION
        ])
      ).toBeTruthy()
    })

    it('should return falsy when coastal erosion is not in risks', () => {
      expect(
        shouldShowPropertyAffectedCoastalErosion([PROJECT_RISK_TYPES.FLUVIAL])
      ).toBeFalsy()
    })
  })

  describe('shouldShowCurrentFloodRisk', () => {
    it('should return true for fluvial, tidal, or sea flooding', () => {
      expect(
        shouldShowCurrentFloodRisk([PROJECT_RISK_TYPES.FLUVIAL])
      ).toBeTruthy()
      expect(
        shouldShowCurrentFloodRisk([PROJECT_RISK_TYPES.TIDAL])
      ).toBeTruthy()
      expect(shouldShowCurrentFloodRisk([PROJECT_RISK_TYPES.SEA])).toBeTruthy()
    })

    it('should return falsy for other risk types', () => {
      expect(
        shouldShowCurrentFloodRisk([PROJECT_RISK_TYPES.SURFACE_WATER])
      ).toBeFalsy()
      expect(
        shouldShowCurrentFloodRisk([PROJECT_RISK_TYPES.COASTAL_EROSION])
      ).toBeFalsy()
    })
  })

  describe('shouldShowCurrentFloodSurfaceWaterRisk', () => {
    it('should return true when surface water flooding is in risks', () => {
      expect(
        shouldShowCurrentFloodSurfaceWaterRisk([
          PROJECT_RISK_TYPES.SURFACE_WATER
        ])
      ).toBeTruthy()
    })

    it('should return falsy when surface water flooding is not in risks', () => {
      expect(
        shouldShowCurrentFloodSurfaceWaterRisk([PROJECT_RISK_TYPES.FLUVIAL])
      ).toBeFalsy()
    })
  })

  describe('shouldShowCurrentCoastalErosionRisk', () => {
    it('should return true when coastal erosion is in risks', () => {
      expect(
        shouldShowCurrentCoastalErosionRisk([
          PROJECT_RISK_TYPES.COASTAL_EROSION
        ])
      ).toBeTruthy()
    })

    it('should return falsy when coastal erosion is not in risks', () => {
      expect(
        shouldShowCurrentCoastalErosionRisk([PROJECT_RISK_TYPES.FLUVIAL])
      ).toBeFalsy()
    })
  })

  describe('getPropertyAffectedFloodingBackLink', () => {
    it('should return risk edit link when main risk is skipped', () => {
      const result = getPropertyAffectedFloodingBackLink([
        PROJECT_RISK_TYPES.FLUVIAL
      ])
      expect(result.targetEditURL).toBe(ROUTES.PROJECT.EDIT.RISK)
    })

    it('should return main risk edit link when main risk is not skipped', () => {
      const result = getPropertyAffectedFloodingBackLink([
        PROJECT_RISK_TYPES.FLUVIAL,
        PROJECT_RISK_TYPES.TIDAL
      ])
      expect(result.targetEditURL).toBe(ROUTES.PROJECT.EDIT.MAIN_RISK)
    })
  })

  describe('getPropertyAffectedCoastalErosionBackLink', () => {
    it('should return appropriate back link based on conditions', () => {
      const result1 = getPropertyAffectedCoastalErosionBackLink(
        [PROJECT_RISK_TYPES.COASTAL_EROSION],
        PROJECT_RISK_TYPES.COASTAL_EROSION
      )
      expect(result1.targetEditURL).toBe(ROUTES.PROJECT.EDIT.RISK)

      const result2 = getPropertyAffectedCoastalErosionBackLink(
        [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.COASTAL_EROSION],
        PROJECT_RISK_TYPES.FLUVIAL
      )
      expect(result2.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING
      )
    })
  })

  describe('getTwentyPercentDeprivedBackLink', () => {
    it('should return coastal erosion link when shown', () => {
      const result = getTwentyPercentDeprivedBackLink([
        PROJECT_RISK_TYPES.COASTAL_EROSION
      ])
      expect(result.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION
      )
    })

    it('should return flooding link when coastal not shown', () => {
      const result = getTwentyPercentDeprivedBackLink([
        PROJECT_RISK_TYPES.FLUVIAL
      ])
      expect(result.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING
      )
    })
  })

  describe('getCurrentFloodSurfaceWaterRiskBackLink', () => {
    it('should return appropriate back link', () => {
      const result1 = getCurrentFloodSurfaceWaterRiskBackLink([
        PROJECT_RISK_TYPES.FLUVIAL
      ])
      expect(result1.targetEditURL).toBe(ROUTES.PROJECT.EDIT.CURRENT_FLOOD_RISK)

      const result2 = getCurrentFloodSurfaceWaterRiskBackLink([
        PROJECT_RISK_TYPES.SURFACE_WATER
      ])
      expect(result2.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED
      )
    })
  })

  describe('getCurrentCoastalErosionRiskBackLink', () => {
    it('should return appropriate back link based on shown pages', () => {
      const result1 = getCurrentCoastalErosionRiskBackLink([
        PROJECT_RISK_TYPES.SURFACE_WATER
      ])
      expect(result1.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK
      )

      const result2 = getCurrentCoastalErosionRiskBackLink([
        PROJECT_RISK_TYPES.FLUVIAL
      ])
      expect(result2.targetEditURL).toBe(ROUTES.PROJECT.EDIT.CURRENT_FLOOD_RISK)

      const result3 = getCurrentCoastalErosionRiskBackLink([
        PROJECT_RISK_TYPES.COASTAL_EROSION
      ])
      expect(result3.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED
      )
    })
  })

  describe('getNextStepAfterFortyPercent', () => {
    it('should return correct next step based on risks', () => {
      const ref = 'TEST123'

      const result1 = getNextStepAfterFortyPercent(
        [PROJECT_RISK_TYPES.FLUVIAL],
        ref
      )
      expect(result1).toContain('current-flood-risk')
      expect(result1).toContain(ref)

      const result2 = getNextStepAfterFortyPercent(
        [PROJECT_RISK_TYPES.SURFACE_WATER],
        ref
      )
      expect(result2).toContain('current-flood-surface-water-risk')

      const result3 = getNextStepAfterFortyPercent(
        [PROJECT_RISK_TYPES.COASTAL_EROSION],
        ref
      )
      expect(result3).toContain('current-coastal-erosion-risk')

      const result4 = getNextStepAfterFortyPercent(
        [PROJECT_RISK_TYPES.GROUNDWATER],
        ref
      )
      expect(result4).toBe(`/project/${ref}`)
    })
  })

  describe('getNextStepAfterCurrentFloodRisk', () => {
    it('should return correct next step', () => {
      const ref = 'TEST123'

      const result1 = getNextStepAfterCurrentFloodRisk(
        [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.SURFACE_WATER],
        ref
      )
      expect(result1).toContain('current-flood-surface-water-risk')

      const result2 = getNextStepAfterCurrentFloodRisk(
        [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.COASTAL_EROSION],
        ref
      )
      expect(result2).toContain('current-coastal-erosion-risk')

      const result3 = getNextStepAfterCurrentFloodRisk(
        [PROJECT_RISK_TYPES.FLUVIAL],
        ref
      )
      expect(result3).toBe(`/project/${ref}`)
    })
  })

  describe('getNextStepAfterCurrentSurfaceWaterRisk', () => {
    it('should return correct next step', () => {
      const ref = 'TEST123'

      const result1 = getNextStepAfterCurrentSurfaceWaterRisk(
        [PROJECT_RISK_TYPES.SURFACE_WATER, PROJECT_RISK_TYPES.COASTAL_EROSION],
        ref
      )
      expect(result1).toContain('current-coastal-erosion-risk')

      const result2 = getNextStepAfterCurrentSurfaceWaterRisk(
        [PROJECT_RISK_TYPES.SURFACE_WATER],
        ref
      )
      expect(result2).toBe(`/project/${ref}`)
    })
  })

  describe('getDynamicBackLink', () => {
    it('should return back link for property affected flooding step', () => {
      const result = getDynamicBackLink(
        PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING,
        {
          risks: [PROJECT_RISK_TYPES.FLUVIAL]
        }
      )
      expect(result).toBeTruthy()
      expect(result.targetEditURL).toBe(ROUTES.PROJECT.EDIT.RISK)
    })

    it('should return back link for property affected coastal erosion step', () => {
      const result = getDynamicBackLink(
        PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION,
        {
          risks: [
            PROJECT_RISK_TYPES.FLUVIAL,
            PROJECT_RISK_TYPES.COASTAL_EROSION
          ],
          mainRisk: PROJECT_RISK_TYPES.FLUVIAL
        }
      )
      expect(result).toBeTruthy()
      expect(result.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING
      )
    })

    it('should return back link for twenty percent deprived step', () => {
      const result = getDynamicBackLink(PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED, {
        risks: [PROJECT_RISK_TYPES.COASTAL_EROSION]
      })
      expect(result).toBeTruthy()
      expect(result.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION
      )
    })

    it('should return back link for current flood surface water risk step', () => {
      const result = getDynamicBackLink(
        PROJECT_STEPS.CURRENT_FLOOD_SURFACE_WATER_RISK,
        {
          risks: [PROJECT_RISK_TYPES.FLUVIAL]
        }
      )
      expect(result).toBeTruthy()
      expect(result.targetEditURL).toBe(ROUTES.PROJECT.EDIT.CURRENT_FLOOD_RISK)
    })

    it('should return back link for current coastal erosion risk step', () => {
      const result = getDynamicBackLink(
        PROJECT_STEPS.CURRENT_COASTAL_EROSION_RISK,
        {
          risks: [PROJECT_RISK_TYPES.SURFACE_WATER]
        }
      )
      expect(result).toBeTruthy()
      expect(result.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK
      )
    })

    it('should return null for unknown step', () => {
      const result = getDynamicBackLink('UNKNOWN_STEP', { risks: [] })
      expect(result).toBeNull()
    })
  })
})
