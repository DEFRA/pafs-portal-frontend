import { describe, it, expect, vi } from 'vitest'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  resolveBackLinkOptions,
  nextRouteAfterSelection,
  nextRouteAfterAdditional,
  nextRouteAfterContributors
} from './navigation-helpers.js'

// Mock the FUNDING_SOURCES_CONFIG since it imports external config
vi.mock('../../helpers/config/funding-sources.js', () => ({
  FUNDING_SOURCES_CONFIG: {
    [PROJECT_STEPS.FUNDING_SOURCES]: {
      backLinkOptions: {
        targetEditURL: '/project/{referenceNumber}/some-step',
        conditionalRedirect: false
      }
    },
    [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]: {
      backLinkOptions: {
        backLinkFn: (sessionData) =>
          sessionData.additionalFcermGia
            ? '/project/{referenceNumber}/additional-sources'
            : '/project/{referenceNumber}/funding-sources'
      }
    },
    [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]: {
      backLinkOptions: {
        backLinkFn: () => '/project/{referenceNumber}/public-contributors'
      }
    },
    [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]: {
      backLinkOptions: {
        targetEditURL: '/project/{referenceNumber}/private-contributors',
        conditionalRedirect: false
      }
    },
    [PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND]: {
      // no backLinkOptions → resolves to {}
    }
  }
}))

const REF = 'TST001E/000A/001A'

describe('funding-sources navigation-helpers', () => {
  describe('resolveBackLinkOptions', () => {
    it('returns {} for an unknown step', () => {
      const result = resolveBackLinkOptions('UNKNOWN_STEP', {})
      expect(result).toEqual({})
    })

    it('returns {} when step has no backLinkOptions', () => {
      const result = resolveBackLinkOptions(
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND,
        {}
      )
      expect(result).toEqual({})
    })

    it('returns static backLinkOptions when no backLinkFn', () => {
      const result = resolveBackLinkOptions(PROJECT_STEPS.FUNDING_SOURCES, {})
      expect(result).toEqual({
        targetEditURL: '/project/{referenceNumber}/some-step',
        conditionalRedirect: false
      })
    })

    it('calls backLinkFn with sessionData and wraps result', () => {
      const sessionData = { additionalFcermGia: true }
      const result = resolveBackLinkOptions(
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        sessionData
      )
      expect(result).toEqual({
        targetEditURL: '/project/{referenceNumber}/additional-sources',
        conditionalRedirect: false
      })
    })

    it('passes sessionData through to backLinkFn correctly', () => {
      const sessionData = { additionalFcermGia: false }
      const result = resolveBackLinkOptions(
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        sessionData
      )
      expect(result).toEqual({
        targetEditURL: '/project/{referenceNumber}/funding-sources',
        conditionalRedirect: false
      })
    })

    it('returns static backLinkOptions for other EA step', () => {
      const result = resolveBackLinkOptions(
        PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS,
        {}
      )
      expect(result).toEqual({
        targetEditURL: '/project/{referenceNumber}/private-contributors',
        conditionalRedirect: false
      })
    })
  })

  describe('nextRouteAfterSelection', () => {
    it('goes to additional sources when additionalFcermGia is true', () => {
      const sessionData = { additionalFcermGia: true }
      const result = nextRouteAfterSelection(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ADDITIONAL_FUNDING_SOURCES_SELECTION.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('goes to public contributors when publicContributions is true and no additionalGia', () => {
      const sessionData = {
        additionalFcermGia: false,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      }
      const result = nextRouteAfterSelection(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('goes to private contributors when only privateContributions is true', () => {
      const sessionData = {
        additionalFcermGia: false,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true
      }
      const result = nextRouteAfterSelection(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('goes to other EA contributors when only otherEaContributions is true', () => {
      const sessionData = {
        additionalFcermGia: false,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
      }
      const result = nextRouteAfterSelection(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('goes to estimated spend when no special sources selected', () => {
      const sessionData = {
        additionalFcermGia: false,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: false
      }
      const result = nextRouteAfterSelection(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ESTIMATED_SPEND.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('additionalFcermGia takes priority over contributor sources', () => {
      const sessionData = {
        additionalFcermGia: true,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      }
      const result = nextRouteAfterSelection(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ADDITIONAL_FUNDING_SOURCES_SELECTION.replace(
          '{referenceNumber}',
          REF
        )
      )
    })
  })

  describe('nextRouteAfterAdditional', () => {
    it('goes to public contributors when publicContributions is true', () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      }
      const result = nextRouteAfterAdditional(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('goes to private contributors when only privateContributions is true', () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true
      }
      const result = nextRouteAfterAdditional(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('goes to other EA contributors when only otherEaContributions is true', () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
      }
      const result = nextRouteAfterAdditional(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS.replace(
          '{referenceNumber}',
          REF
        )
      )
    })

    it('goes to estimated spend when no contributor sources selected', () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: false
      }
      const result = nextRouteAfterAdditional(sessionData, REF)
      expect(result).toBe(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ESTIMATED_SPEND.replace(
          '{referenceNumber}',
          REF
        )
      )
    })
  })

  describe('nextRouteAfterContributors', () => {
    describe('from PUBLIC_CONTRIBUTORS step', () => {
      const step = PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS

      it('goes to private contributors when privateContributions is true', () => {
        const sessionData = {
          [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true
        }
        const result = nextRouteAfterContributors(step, sessionData, REF)
        expect(result).toBe(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS.replace(
            '{referenceNumber}',
            REF
          )
        )
      })

      it('goes to other EA when only otherEaContributions is true', () => {
        const sessionData = {
          [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
          [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
        }
        const result = nextRouteAfterContributors(step, sessionData, REF)
        expect(result).toBe(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS.replace(
            '{referenceNumber}',
            REF
          )
        )
      })

      it('goes to estimated spend when no further contributor sources', () => {
        const sessionData = {
          [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
          [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: false
        }
        const result = nextRouteAfterContributors(step, sessionData, REF)
        expect(result).toBe(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ESTIMATED_SPEND.replace(
            '{referenceNumber}',
            REF
          )
        )
      })
    })

    describe('from PRIVATE_CONTRIBUTORS step', () => {
      const step = PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS

      it('goes to other EA when otherEaContributions is true', () => {
        const sessionData = {
          [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
        }
        const result = nextRouteAfterContributors(step, sessionData, REF)
        expect(result).toBe(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS.replace(
            '{referenceNumber}',
            REF
          )
        )
      })

      it('goes to estimated spend when otherEaContributions is false', () => {
        const sessionData = {
          [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: false
        }
        const result = nextRouteAfterContributors(step, sessionData, REF)
        expect(result).toBe(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ESTIMATED_SPEND.replace(
            '{referenceNumber}',
            REF
          )
        )
      })
    })

    describe('from OTHER_EA_CONTRIBUTORS step', () => {
      const step = PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS

      it('always goes to estimated spend', () => {
        const result = nextRouteAfterContributors(step, {}, REF)
        expect(result).toBe(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ESTIMATED_SPEND.replace(
            '{referenceNumber}',
            REF
          )
        )
      })

      it('goes to estimated spend even when other sources are selected', () => {
        const sessionData = {
          [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
          [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true
        }
        const result = nextRouteAfterContributors(step, sessionData, REF)
        expect(result).toBe(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ESTIMATED_SPEND.replace(
            '{referenceNumber}',
            REF
          )
        )
      })
    })
  })
})
