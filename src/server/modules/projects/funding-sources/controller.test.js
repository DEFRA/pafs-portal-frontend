import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  fundingSourcesSelectionController,
  additionalFundingSourcesController,
  publicContributorsController,
  privateContributorsController,
  otherEaContributorsController,
  publicContributorsDeleteController,
  privateContributorsDeleteController,
  otherEaContributorsDeleteController,
  estimatedSpendController
} from './controller.js'
import {
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS
} from '../../../common/constants/projects.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../common/helpers/error-renderer/index.js', () => ({
  extractJoiErrors: vi.fn()
}))

vi.mock('../helpers/config/funding-sources.js', () => ({
  FUNDING_SOURCES_CONFIG: {
    'funding-sources': {
      localKeyPrefix: 'projects.funding_sources.funding_sources_selection',
      backLinkOptions: {
        targetEditURL: '/project/overview',
        conditionalRedirect: true
      },
      schema: { validate: vi.fn().mockReturnValue({ error: null }) }
    },
    'funding-sources-additional': {
      localKeyPrefix: 'projects.funding_sources.additional',
      backLinkOptions: {
        targetEditURL: '/funding-sources',
        conditionalRedirect: false
      },
      schema: { validate: vi.fn().mockReturnValue({ error: null }) },
      gateField: 'additionalFcermGia'
    },
    'funding-sources-public-contributors': {
      localKeyPrefix: 'projects.funding_sources.public',
      backLinkOptions: {
        targetEditURL: '/funding-sources',
        conditionalRedirect: false
      },
      schema: { validate: vi.fn().mockReturnValue({ error: null }) },
      gateField: 'publicContributions',
      deleteRoute:
        '/project/{referenceNumber}/funding-sources/public-contributors/delete',
      fieldName: 'publicContributorNames'
    },
    'funding-sources-private-contributors': {
      localKeyPrefix: 'projects.funding_sources.private',
      backLinkOptions: {
        targetEditURL: '/funding-sources',
        conditionalRedirect: false
      },
      schema: { validate: vi.fn().mockReturnValue({ error: null }) },
      gateField: 'privateContributions',
      deleteRoute:
        '/project/{referenceNumber}/funding-sources/private-contributors/delete',
      fieldName: 'privateContributorNames'
    },
    'funding-sources-other-ea-contributors': {
      localKeyPrefix: 'projects.funding_sources.other_ea',
      backLinkOptions: {
        targetEditURL: '/funding-sources',
        conditionalRedirect: false
      },
      schema: { validate: vi.fn().mockReturnValue({ error: null }) },
      gateField: 'otherEaContributions',
      deleteRoute:
        '/project/{referenceNumber}/funding-sources/other-ea-contributors/delete',
      fieldName: 'otherEaContributorNames'
    },
    'funding-sources-estimated-spend': {
      localKeyPrefix: 'projects.funding_sources.estimated_spend',
      backLinkOptions: {
        targetEditURL: '/funding-sources',
        conditionalRedirect: false
      },
      schema: vi
        .fn()
        .mockReturnValue({ validate: vi.fn().mockReturnValue({ error: null }) })
    }
  }
}))

vi.mock('../helpers/project-submission.js', () => ({
  saveProjectWithErrorHandling: vi.fn()
}))

vi.mock('../helpers/project-utils.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    buildViewData: vi.fn(),
    buildFinancialYearLabel: vi.fn((y) => `${y}/${y + 1}`),
    buildIdToYearMap: actual.buildIdToYearMap,
    buildContributorsByYear: actual.buildContributorsByYear,
    formatNumberWithCommas: vi.fn((n) => String(n)),
    getCurrentFinancialYearStartYear: actual.getCurrentFinancialYearStartYear,
    getSessionData: vi.fn(),
    getUniqueContributorNamesFromDb: actual.getUniqueContributorNamesFromDb,
    navigateToProjectOverview: vi.fn(),
    updateSessionData: vi.fn()
  }
})

vi.mock('./helpers/navigation-helpers.js', () => ({
  resolveBackLinkOptions: vi.fn().mockReturnValue({}),
  nextRouteAfterSelection: vi.fn().mockReturnValue('/next-selection'),
  nextRouteAfterAdditional: vi.fn().mockReturnValue('/next-additional'),
  nextRouteAfterContributors: vi.fn().mockReturnValue('/next-contributors'),
  CONTRIBUTOR_STEP_ROUTE: {
    'funding-sources-public-contributors':
      '/project/{referenceNumber}/funding-sources/public-contributors',
    'funding-sources-private-contributors':
      '/project/{referenceNumber}/funding-sources/private-contributors',
    'funding-sources-other-ea-contributors':
      '/project/{referenceNumber}/funding-sources/other-ea-contributors'
  }
}))

vi.mock('./helpers/payload-helpers.js', () => ({
  clearFundingValueFields: vi.fn(),
  sanitiseFundingValueRow: vi.fn((row) => row),
  setSourceTotalsFromContributorArrays: vi.fn((row) => row),
  stripEmptyContributorEntries: vi.fn((row) => row),
  stripEmptyContributorEntriesWithMapping: vi.fn((row) => ({
    row,
    indexMaps: {}
  })),
  sanitiseZerosFromValidatedRows: vi.fn((rows) => rows),
  parseFundingValuesPayload: vi.fn().mockReturnValue([]),
  parseContributorsPayload: vi.fn().mockReturnValue(['Alice'])
}))

vi.mock('./helpers/estimated-spending-helpers.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    buildEstimatedSpendRows: vi.fn().mockReturnValue([]),
    getContributorNames: vi.fn().mockReturnValue([]),
    getSelectedEstimatedSpendSourceFields: vi.fn().mockReturnValue([]),
    localizeContributorErrorMessage: vi.fn((msg) => msg),
    CONTRIBUTOR_SPEND_GROUPS: actual.CONTRIBUTOR_SPEND_GROUPS
  }
})

// ─── Import mocked modules for assertion ─────────────────────────────────────

import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import {
  nextRouteAfterSelection,
  nextRouteAfterAdditional,
  nextRouteAfterContributors,
  resolveBackLinkOptions
} from './helpers/navigation-helpers.js'
import {
  clearFundingValueFields,
  parseFundingValuesPayload,
  parseContributorsPayload,
  sanitiseFundingValueRow,
  setSourceTotalsFromContributorArrays,
  stripEmptyContributorEntries,
  stripEmptyContributorEntriesWithMapping,
  sanitiseZerosFromValidatedRows
} from './helpers/payload-helpers.js'
import {
  buildEstimatedSpendRows,
  getContributorNames,
  getSelectedEstimatedSpendSourceFields,
  CONTRIBUTOR_SPEND_GROUPS
} from './helpers/estimated-spending-helpers.js'
import { FUNDING_SOURCES_CONFIG } from '../helpers/config/funding-sources.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REF = 'TST001E/000A/001A'

function makeRequest(overrides = {}) {
  return {
    t: vi.fn((key) => key),
    params: { referenceNumber: REF },
    payload: {},
    yar: { get: vi.fn(), set: vi.fn() },
    ...overrides
  }
}

function makeH() {
  const redirect = vi.fn()
  const takeover = vi.fn().mockReturnValue(Symbol('takeover'))
  redirect.mockReturnValue({ takeover })
  return {
    view: vi.fn().mockReturnValue(Symbol('view')),
    redirect,
    takeover
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('fundingSourcesSelectionController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    getSessionData.mockReturnValue({})
    saveProjectWithErrorHandling.mockResolvedValue(null)
    extractJoiErrors.mockReturnValue({})
  })

  describe('getHandler', () => {
    it('calls buildViewData with the correct step and renders the view', async () => {
      await fundingSourcesSelectionController.getHandler(request, h)
      expect(buildViewData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ localKeyPrefix: expect.any(String) })
      )
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES,
        expect.any(Object)
      )
    })
  })

  describe('postHandler', () => {
    it('normalises checkbox fields and updates session', async () => {
      request.payload = {
        [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: 'true',
        [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: 'false'
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES
      ].schema.validate.mockReturnValue({
        error: null
      })
      await fundingSourcesSelectionController.postHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ fcermGia: true, localLevy: false })
      )
    })

    it('re-renders with errors when validation fails', async () => {
      const mockError = {
        details: [{ message: 'required', path: ['fcermGia'] }]
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES
      ].schema.validate.mockReturnValue({
        error: mockError
      })
      extractJoiErrors.mockReturnValue({ fcermGia: 'required' })
      await fundingSourcesSelectionController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES,
        expect.any(Object)
      )
    })

    it('redirects after successful save', async () => {
      request.payload = {}
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES
      ].schema.validate.mockReturnValue({
        error: null
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      getSessionData.mockReturnValue({})
      await fundingSourcesSelectionController.postHandler(request, h)
      expect(nextRouteAfterSelection).toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith('/next-selection')
    })

    it('returns save error when save fails', async () => {
      request.payload = {}
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES
      ].schema.validate.mockReturnValue({
        error: null
      })
      const saveErr = Symbol('saveErr')
      saveProjectWithErrorHandling.mockResolvedValue(saveErr)
      const result = await fundingSourcesSelectionController.postHandler(
        request,
        h
      )
      expect(result).toBe(saveErr)
    })

    it('resets additional GIA fields when additionalFcermGia is deselected', async () => {
      request.payload = {} // no additionalFcermGia → normalised false
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES
      ].schema.validate.mockReturnValue({
        error: null
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      getSessionData.mockReturnValue({})
      await fundingSourcesSelectionController.postHandler(request, h)
      expect(clearFundingValueFields).toHaveBeenCalled()
    })

    it('does not reset additional GIA fields when additionalFcermGia stays selected', async () => {
      request.payload = { additionalFcermGia: 'true' }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES
      ].schema.validate.mockReturnValue({
        error: null
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      getSessionData.mockReturnValue({})
      await fundingSourcesSelectionController.postHandler(request, h)
      expect(clearFundingValueFields).not.toHaveBeenCalled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('additionalFundingSourcesController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    saveProjectWithErrorHandling.mockResolvedValue(null)
    extractJoiErrors.mockReturnValue({})
  })

  describe('getHandler', () => {
    it('renders the additional sources view when gate passes', async () => {
      getSessionData.mockReturnValue({ additionalFcermGia: true })
      await additionalFundingSourcesController.getHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ADDITIONAL,
        expect.any(Object)
      )
    })

    it('navigates to overview when gate fails', async () => {
      getSessionData.mockReturnValue({ additionalFcermGia: false })
      await additionalFundingSourcesController.getHandler(request, h)
      expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
    })
  })

  describe('postHandler', () => {
    it('navigates to overview when gate fails', async () => {
      getSessionData.mockReturnValue({ additionalFcermGia: false })
      await additionalFundingSourcesController.postHandler(request, h)
      expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
    })

    it('re-renders with errors when validation fails', async () => {
      getSessionData.mockReturnValue({ additionalFcermGia: true })
      request.payload = {}
      const mockError = { details: [{ message: 'required' }] }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL
      ].schema.validate.mockReturnValue({
        error: mockError
      })
      extractJoiErrors.mockReturnValue({ someField: 'required' })
      await additionalFundingSourcesController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ADDITIONAL,
        expect.any(Object)
      )
    })

    it('clears deselected additional GIA fields and redirects', async () => {
      getSessionData
        .mockReturnValueOnce({ additionalFcermGia: true })
        .mockReturnValue({ additionalFcermGia: true })
      request.payload = {
        [PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE]: 'true'
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL
      ].schema.validate.mockReturnValue({
        error: null
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      await additionalFundingSourcesController.postHandler(request, h)
      expect(clearFundingValueFields).toHaveBeenCalled()
      expect(nextRouteAfterAdditional).toHaveBeenCalled()
    })

    it('redirects without clearing when all additional GIA fields remain selected', async () => {
      getSessionData
        .mockReturnValueOnce({ additionalFcermGia: true })
        .mockReturnValue({ additionalFcermGia: true })
      request.payload = {
        [PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE]: 'true',
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING]: 'true',
        [PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES]: 'true',
        [PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID]: 'true',
        [PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT]: 'true',
        [PROJECT_PAYLOAD_FIELDS.RECOVERY]: 'true',
        [PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND]: 'true'
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL
      ].schema.validate.mockReturnValue({
        error: null
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      await additionalFundingSourcesController.postHandler(request, h)
      expect(clearFundingValueFields).not.toHaveBeenCalled()
      expect(nextRouteAfterAdditional).toHaveBeenCalled()
    })

    it('returns save error when save fails', async () => {
      getSessionData.mockReturnValue({ additionalFcermGia: true })
      request.payload = {}
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL
      ].schema.validate.mockReturnValue({
        error: null
      })
      const saveErr = Symbol('saveErr')
      saveProjectWithErrorHandling.mockResolvedValue(saveErr)
      const result = await additionalFundingSourcesController.postHandler(
        request,
        h
      )
      expect(result).toBe(saveErr)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('publicContributorsController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    saveProjectWithErrorHandling.mockResolvedValue(null)
    extractJoiErrors.mockReturnValue({})
    resolveBackLinkOptions.mockReturnValue({})
  })

  describe('getHandler', () => {
    it('renders contributor view when gate passes', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      })
      await publicContributorsController.getHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        expect.any(Object)
      )
    })

    it('redirects to overview when gate fails', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false
      })
      await publicContributorsController.getHandler(request, h)
      expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
    })

    it('seeds session from CSV when session array is empty', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: 'Alice, Bob',
        _publicContributorsSession: []
      })
      await publicContributorsController.getHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          _publicContributorsSession: ['Alice', 'Bob']
        })
      )
    })

    it('inserts empty slot when no contributors exist', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      })
      await publicContributorsController.getHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ _publicContributorsSession: [''] })
      )
    })

    it('falls back to pafs_core_funding_contributors when session and CSV are empty', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        pafs_core_funding_contributors: [
          { contributorType: 'public_contributions', name: 'Legacy Alice' },
          { contributorType: 'public_contributions', name: 'Legacy Bob' },
          { contributorType: 'private_contributions', name: 'Ignored' }
        ]
      })
      await publicContributorsController.getHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          _publicContributorsSession: ['Legacy Alice', 'Legacy Bob']
        })
      )
    })
  })

  describe('postHandler', () => {
    it('redirects to overview when gate fails', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false
      })
      await publicContributorsController.postHandler(request, h)
      expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
    })

    it('handles add action: preserves values and appends empty slot', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice']
      })
      request.payload = { action: 'add' }
      parseContributorsPayload.mockReturnValue(['Alice'])
      await publicContributorsController.postHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ _publicContributorsSession: ['Alice', ''] })
      )
      expect(h.redirect).toHaveBeenCalledWith(expect.stringContaining(REF))
    })

    it('validates contributor names and saves when valid', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['Alice'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice']
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      await publicContributorsController.postHandler(request, h)
      expect(nextRouteAfterContributors).toHaveBeenCalled()
    })

    it('re-renders with error when no contributors entered', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue([''])
      await publicContributorsController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        expect.any(Object)
      )
    })

    it('re-renders with validation error for invalid contributor name', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['Alice'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
      ].schema.validate.mockReturnValue({
        error: { details: [{ message: 'string.pattern.base' }] }
      })
      extractJoiErrors.mockReturnValue({ 0: 'string.pattern.base' })
      await publicContributorsController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        expect.any(Object)
      )
    })

    it('re-renders with duplicate error for duplicate names', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice', 'alice']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['Alice', 'alice'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      await publicContributorsController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        expect.any(Object)
      )
    })

    it('returns save error when save fails', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['Alice'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      const saveErr = Symbol('saveErr')
      saveProjectWithErrorHandling.mockResolvedValue(saveErr)
      const result = await publicContributorsController.postHandler(request, h)
      expect(result).toBe(saveErr)
    })

    it("falls back to empty slot when session contributors missing (|| [''] fallback)", async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
        // no _publicContributorsSession key
      })
      request.payload = { action: 'add' }
      parseContributorsPayload.mockReturnValue([''])
      await publicContributorsController.postHandler(request, h)
      expect(h.redirect).toHaveBeenCalledWith(expect.stringContaining(REF))
    })

    it('handles non-string names gracefully in add and submit paths (typeof branches)', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice']
      })
      // Make parseContributorsPayload return a non-string value in the ADD path (covers line 315)
      request.payload = { action: 'add' }
      parseContributorsPayload.mockReturnValue([null, 'Alice'])
      await publicContributorsController.postHandler(request, h)
      expect(h.redirect).toHaveBeenCalledWith(expect.stringContaining(REF))
    })

    it('handles non-string names gracefully in submit path (line 330 typeof branch)', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        _publicContributorsSession: ['Alice']
      })
      // Non-string in the continue (submit) path
      request.payload = {}
      parseContributorsPayload.mockReturnValue([null, 'Alice'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      await publicContributorsController.postHandler(request, h)
      expect(nextRouteAfterContributors).toHaveBeenCalled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('privateContributorsController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    saveProjectWithErrorHandling.mockResolvedValue(null)
    resolveBackLinkOptions.mockReturnValue({})
  })

  it('renders view when gate passes', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true
    })
    await privateContributorsController.getHandler(request, h)
    expect(h.view).toHaveBeenCalledWith(
      PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
      expect.any(Object)
    )
  })

  it('navigates to overview when gate fails', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false
    })
    await privateContributorsController.getHandler(request, h)
    expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
  })

  describe('postHandler', () => {
    it('validates and navigates when valid', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true,
        _privateContributorsSession: ['Corp A']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['Corp A'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      await privateContributorsController.postHandler(request, h)
      expect(nextRouteAfterContributors).toHaveBeenCalled()
    })

    it('re-renders with error when no contributors entered', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true,
        _privateContributorsSession: ['']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue([''])
      await privateContributorsController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        expect.any(Object)
      )
    })

    it('returns save error when save fails', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true,
        _privateContributorsSession: ['Corp A']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['Corp A'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      const saveErr = Symbol('saveErr')
      saveProjectWithErrorHandling.mockResolvedValue(saveErr)
      const result = await privateContributorsController.postHandler(request, h)
      expect(result).toBe(saveErr)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('otherEaContributorsController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    saveProjectWithErrorHandling.mockResolvedValue(null)
    resolveBackLinkOptions.mockReturnValue({})
  })

  it('renders view when gate passes', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
    })
    await otherEaContributorsController.getHandler(request, h)
    expect(h.view).toHaveBeenCalledWith(
      PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
      expect.any(Object)
    )
  })

  it('navigates to overview when gate fails', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: false
    })
    await otherEaContributorsController.getHandler(request, h)
    expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
  })

  describe('postHandler', () => {
    it('validates and navigates when valid', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true,
        _otherEaContributorsSession: ['EA Org']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['EA Org'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      await otherEaContributorsController.postHandler(request, h)
      expect(nextRouteAfterContributors).toHaveBeenCalled()
    })

    it('re-renders with error when no contributors entered', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true,
        _otherEaContributorsSession: ['']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue([''])
      await otherEaContributorsController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        expect.any(Object)
      )
    })

    it('returns save error when save fails', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true,
        _otherEaContributorsSession: ['EA Org']
      })
      request.payload = {}
      parseContributorsPayload.mockReturnValue(['EA Org'])
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
      ].schema.validate.mockReturnValue({ error: null })
      const saveErr = Symbol('saveErr')
      saveProjectWithErrorHandling.mockResolvedValue(saveErr)
      const result = await otherEaContributorsController.postHandler(request, h)
      expect(result).toBe(saveErr)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('publicContributorsDeleteController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest({ params: { referenceNumber: REF, index: '0' } })
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
  })

  describe('getHandler', () => {
    it('renders the delete confirmation view', async () => {
      getSessionData.mockReturnValue({
        _publicContributorsSession: ['Alice', 'Bob']
      })
      await publicContributorsDeleteController.getHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE,
        expect.any(Object)
      )
    })

    it('populates contributors from CSV when session is empty', async () => {
      getSessionData.mockReturnValue({
        _publicContributorsSession: [],
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: 'Alice, Bob'
      })
      await publicContributorsDeleteController.getHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE,
        expect.any(Object)
      )
    })

    it('uses empty string for contributorName when index is out of bounds', async () => {
      getSessionData.mockReturnValue({ _publicContributorsSession: [] })
      request.params.index = '99'
      await publicContributorsDeleteController.getHandler(request, h)
      expect(buildViewData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          additionalData: expect.objectContaining({ contributorName: '' })
        })
      )
    })

    it('falls back to empty array when session contributors key is missing (|| [] fallback)', async () => {
      getSessionData.mockReturnValue({
        // no _publicContributorsSession key, no CSV
      })
      await publicContributorsDeleteController.getHandler(request, h)
      expect(buildViewData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          additionalData: expect.objectContaining({ contributorName: '' })
        })
      )
    })
  })

  describe('postHandler', () => {
    it('re-renders with fieldError when confirm is not yes/no', async () => {
      getSessionData.mockReturnValue({ _publicContributorsSession: ['Alice'] })
      request.payload = { confirm: '' }
      await publicContributorsDeleteController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE,
        expect.any(Object)
      )
    })

    it('falls back to empty array and empty name when no session key and no CSV (lines 478, 481, 488)', async () => {
      getSessionData.mockReturnValue({
        // no _publicContributorsSession, no CSV
      })
      request.payload = { confirm: '' } // invalid confirm triggers buildViewData
      await publicContributorsDeleteController.postHandler(request, h)
      // contributor name should be '' from the || '' fallback
      expect(buildViewData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          additionalData: expect.objectContaining({ contributorName: '' })
        })
      )
    })

    it('removes contributor and redirects when confirm is yes', async () => {
      getSessionData.mockReturnValue({
        _publicContributorsSession: ['Alice', 'Bob']
      })
      request.payload = { confirm: 'yes' }
      await publicContributorsDeleteController.postHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ _publicContributorsSession: ['Bob'] })
      )
      expect(h.redirect).toHaveBeenCalled()
    })

    it('adds empty slot when last contributor is deleted', async () => {
      getSessionData.mockReturnValue({ _publicContributorsSession: ['Alice'] })
      request.payload = { confirm: 'yes' }
      await publicContributorsDeleteController.postHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ _publicContributorsSession: [''] })
      )
    })

    it('redirects without removing when confirm is no', async () => {
      getSessionData.mockReturnValue({ _publicContributorsSession: ['Alice'] })
      request.payload = { confirm: 'no' }
      await publicContributorsDeleteController.postHandler(request, h)
      expect(updateSessionData).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalled()
    })

    it('populates from CSV when session is empty during delete', async () => {
      getSessionData.mockReturnValue({
        _publicContributorsSession: [],
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: 'Alice, Bob'
      })
      request.params = { referenceNumber: REF, index: '0' }
      request.payload = { confirm: 'no' }
      await publicContributorsDeleteController.postHandler(request, h)
      expect(h.redirect).toHaveBeenCalled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('privateContributorsDeleteController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest({ params: { referenceNumber: REF, index: '0' } })
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    getSessionData.mockReturnValue({ _privateContributorsSession: ['Corp A'] })
  })

  it('renders the delete view', async () => {
    await privateContributorsDeleteController.getHandler(request, h)
    expect(h.view).toHaveBeenCalledWith(
      PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE,
      expect.any(Object)
    )
  })

  it('deletes and redirects when confirmed', async () => {
    request.payload = { confirm: 'yes' }
    await privateContributorsDeleteController.postHandler(request, h)
    expect(h.redirect).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('otherEaContributorsDeleteController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest({ params: { referenceNumber: REF, index: '0' } })
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    getSessionData.mockReturnValue({ _otherEaContributorsSession: ['EA Org'] })
  })

  it('renders the delete view', async () => {
    await otherEaContributorsDeleteController.getHandler(request, h)
    expect(h.view).toHaveBeenCalledWith(
      PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE,
      expect.any(Object)
    )
  })

  it('deletes and redirects when confirmed', async () => {
    request.payload = { confirm: 'yes' }
    await otherEaContributorsDeleteController.postHandler(request, h)
    expect(h.redirect).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('estimatedSpendController', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    saveProjectWithErrorHandling.mockResolvedValue(null)
    resolveBackLinkOptions.mockReturnValue({})
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2026
    })
    buildEstimatedSpendRows.mockReturnValue([])
    getSelectedEstimatedSpendSourceFields.mockReturnValue([])
    parseFundingValuesPayload.mockReturnValue([])
    sanitiseFundingValueRow.mockImplementation((row) => row)
    setSourceTotalsFromContributorArrays.mockImplementation((row) => row)
    stripEmptyContributorEntries.mockImplementation((row) => row)
    stripEmptyContributorEntriesWithMapping.mockImplementation((row) => ({
      row,
      indexMaps: {}
    }))
    sanitiseZerosFromValidatedRows.mockImplementation((rows) => rows)
  })

  describe('getHandler', () => {
    it('renders the estimated spend view', async () => {
      await estimatedSpendController.getHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        expect.any(Object)
      )
    })
  })

  describe('postHandler', () => {
    it('updates session with parsed funding values', async () => {
      parseFundingValuesPayload.mockReturnValue([
        { financialYear: 2025, fcermGia: '1000' }
      ])
      sanitiseFundingValueRow.mockReturnValue({
        financialYear: 2025,
        fcermGia: '1000'
      })
      setSourceTotalsFromContributorArrays.mockReturnValue({
        financialYear: 2025,
        fcermGia: '1000'
      })
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(updateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: expect.any(Array)
        })
      )
    })

    it('redirects on update-totals action (no-JS path)', async () => {
      request.payload = { action: 'update-totals' }
      await estimatedSpendController.postHandler(request, h)
      expect(h.redirect).toHaveBeenCalledWith(expect.stringContaining(REF))
    })

    it('renders with globalError when contributor coverage fails', async () => {
      // Set up a contributor group that will fail coverage check
      const mockGroup = {
        enabledField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
        contributorArrayField: 'publicContributors'
      }
      // Replace CONTRIBUTOR_SPEND_GROUPS temporarily
      vi.mocked(CONTRIBUTOR_SPEND_GROUPS).length = 0
      vi.mocked(CONTRIBUTOR_SPEND_GROUPS).push(mockGroup)
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      })
      getContributorNames.mockReturnValue(['Alice'])
      parseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2025,
          publicContributors: [{ name: 'Alice', amount: null }]
        }
      ])
      sanitiseFundingValueRow.mockReturnValue({
        financialYear: 2025,
        publicContributors: [{ name: 'Alice', amount: null }]
      })
      setSourceTotalsFromContributorArrays.mockReturnValue({
        financialYear: 2025,
        publicContributors: [{ name: 'Alice', amount: null }]
      })
      stripEmptyContributorEntriesWithMapping.mockReturnValue({
        row: {
          financialYear: 2025,
          publicContributors: [{ name: 'Alice', amount: null }]
        },
        indexMaps: {}
      })

      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        expect.any(Object)
      )
    })

    it('passes contributor coverage check when contributor has valid amount', async () => {
      const mockGroup = {
        enabledField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
        contributorArrayField: 'publicContributors'
      }
      vi.mocked(CONTRIBUTOR_SPEND_GROUPS).length = 0
      vi.mocked(CONTRIBUTOR_SPEND_GROUPS).push(mockGroup)
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      })
      getContributorNames.mockReturnValue(['Alice'])
      parseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2025,
          publicContributors: [{ name: 'Alice', amount: '1000' }]
        }
      ])
      sanitiseFundingValueRow.mockReturnValue({
        financialYear: 2025,
        publicContributors: [{ name: 'Alice', amount: '1000' }]
      })
      setSourceTotalsFromContributorArrays.mockReturnValue({
        financialYear: 2025,
        publicContributors: [{ name: 'Alice', amount: '1000' }]
      })
      stripEmptyContributorEntriesWithMapping.mockReturnValue({
        row: {
          financialYear: 2025,
          publicContributors: [{ name: 'Alice', amount: '1000' }]
        },
        indexMaps: {}
      })
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: null })
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
    })

    it('renders with globalError from contributor coverage even when schema also errors (covers !globalError branch)', async () => {
      const mockGroup = {
        enabledField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
        contributorArrayField: 'publicContributors'
      }
      vi.mocked(CONTRIBUTOR_SPEND_GROUPS).length = 0
      vi.mocked(CONTRIBUTOR_SPEND_GROUPS).push(mockGroup)
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      })
      getContributorNames.mockReturnValue(['Alice'])
      const rowWithNullAmount = {
        financialYear: 2025,
        publicContributors: [{ name: 'Alice', amount: null }]
      }
      parseFundingValuesPayload.mockReturnValue([rowWithNullAmount])
      sanitiseFundingValueRow.mockReturnValue(rowWithNullAmount)
      setSourceTotalsFromContributorArrays.mockReturnValue(rowWithNullAmount)
      stripEmptyContributorEntriesWithMapping.mockReturnValue({
        row: rowWithNullAmount,
        indexMaps: {}
      })
      // Also have a schema error so both paths fire
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({
          error: { details: [{ path: [], type: 'array.min' }] }
        })
      })
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        expect.any(Object)
      )
    })

    it('renders with fieldErrors when schema validation fails', async () => {
      const mockError = {
        details: [{ path: [0, 'fcermGia'], type: 'string.pattern.base' }]
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: mockError })
      })
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        expect.any(Object)
      )
    })

    it('renders with max digits error for string.max validation errors', async () => {
      const mockError = {
        details: [{ path: [0, 'fcermGia'], type: 'string.max' }]
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: mockError })
      })
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        expect.any(Object)
      )
    })

    it('handles validation error with empty path (global error)', async () => {
      const mockError = {
        details: [{ path: [], type: 'array.min' }]
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: mockError })
      })
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        expect.any(Object)
      )
    })

    it('handles validation error with single-number path (global error)', async () => {
      const mockError = {
        details: [{ path: [0], type: 'object.base' }]
      }
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: mockError })
      })
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(h.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        expect.any(Object)
      )
    })

    it('saves and navigates to overview after successful validation', async () => {
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: null })
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)
      request.payload = {}
      await estimatedSpendController.postHandler(request, h)
      expect(navigateToProjectOverview).toHaveBeenCalledWith(REF, h)
    })

    it('returns save error when save fails after validation', async () => {
      FUNDING_SOURCES_CONFIG[
        PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
      ].schema.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: null })
      })
      const saveErr = Symbol('saveErr')
      saveProjectWithErrorHandling.mockResolvedValue(saveErr)
      request.payload = {}
      const result = await estimatedSpendController.postHandler(request, h)
      expect(result).toBe(saveErr)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// _buildFundingValuesFromProjectData (tested via estimatedSpendController
//  by setting up pafs_core_funding_values/pafs_core_funding_contributors in session)
// ─────────────────────────────────────────────────────────────────────────────

describe('_buildFundingValuesFromProjectData (via getEstimatedSpend)', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    resolveBackLinkOptions.mockReturnValue({})
    buildEstimatedSpendRows.mockReturnValue([])
  })

  it('returns placeholder rows for year range when pafs_core_funding_values is empty', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      pafs_core_funding_values: [],
      pafs_core_funding_contributors: []
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          existingValues: [{ financialYear: 2025 }]
        })
      })
    )
  })

  it('merges funding values with contributors when IDs are present', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      pafs_core_funding_values: [
        { id: 1, financialYear: 2025, fcermGia: '1000' }
      ],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 1,
          name: 'Alice',
          contributorType: 'public_contributions',
          amount: '500'
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          existingValues: expect.arrayContaining([
            expect.objectContaining({
              publicContributors: expect.arrayContaining([
                expect.objectContaining({ name: 'Alice' })
              ])
            })
          ])
        })
      })
    )
  })

  it('uses positional fallback when funding values have no ids', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      pafs_core_funding_values: [{ financialYear: 2025, fcermGia: '1000' }],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 10,
          name: 'Bob',
          contributorType: 'private_contributions',
          amount: '200'
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalled()
  })

  it('uses positional fallback with multiple rows (exercises sort comparators)', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2026,
      pafs_core_funding_values: [
        { financialYear: 2026, fcermGia: '2000' },
        { financialYear: 2025, fcermGia: '1000' }
      ],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 20,
          name: 'Corp',
          contributorType: 'private_contributions',
          amount: '300'
        },
        {
          fundingValueId: 10,
          name: 'Corp',
          contributorType: 'private_contributions',
          amount: '100'
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalled()
  })

  it('adds private and otherEa contributors to the correct arrays', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 1,
          name: 'Corp',
          contributorType: 'private_contributions',
          amount: '100'
        },
        {
          fundingValueId: 1,
          name: 'EA',
          contributorType: 'other_ea_contributions',
          amount: '200'
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          existingValues: expect.arrayContaining([
            expect.objectContaining({
              privateContributors: expect.arrayContaining([
                expect.objectContaining({ name: 'Corp' })
              ]),
              otherEaContributors: expect.arrayContaining([
                expect.objectContaining({ name: 'EA' })
              ])
            })
          ])
        })
      })
    )
  })

  it('positional fallback skips extra referenced IDs when more IDs than funding values (idx >= length)', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      // Only 1 funding value row, but contributors reference 2 different IDs
      pafs_core_funding_values: [{ financialYear: 2025 }],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 1,
          name: 'Corp A',
          contributorType: 'private_contributions',
          amount: '100'
        },
        {
          fundingValueId: 2,
          name: 'Corp B',
          contributorType: 'private_contributions',
          amount: '200'
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalled()
  })

  it('skips contributors whose fundingValueId cannot be resolved', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 999,
          name: 'Ghost',
          contributorType: 'public_contributions',
          amount: '300'
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    const callArgs = buildViewData.mock.calls[0][1]
    const existingValues = callArgs.additionalData.existingValues
    expect(existingValues[0].publicContributors).toBeUndefined()
  })

  it('handles contributors with null amount (converts to empty string)', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 1,
          name: 'Corp',
          contributorType: 'public_contributions',
          amount: null
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    const callArgs = buildViewData.mock.calls[0][1]
    const publicContributors =
      callArgs.additionalData.existingValues[0].publicContributors
    expect(publicContributors[0].amount).toBe('')
  })

  it('ignores contributors with unrecognized contributorType (else branch at line 663)', async () => {
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
      pafs_core_funding_contributors: [
        {
          fundingValueId: 1,
          name: 'Corp',
          contributorType: 'unknown_type',
          amount: '100'
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    const callArgs = buildViewData.mock.calls[0][1]
    const existingValues = callArgs.additionalData.existingValues
    // Unknown type is ignored, no arrays added to the row
    expect(existingValues[0].publicContributors).toBeUndefined()
    expect(existingValues[0].privateContributors).toBeUndefined()
    expect(existingValues[0].otherEaContributors).toBeUndefined()
  })

  it('uses session fundingValues when already set', async () => {
    const existingFv = [{ financialYear: 2025, fcermGia: '999' }]
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: existingFv
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          existingValues: existingFv
        })
      })
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// _calculateServerTotals (tested via getEstimatedSpend with spendRows set up)
// ─────────────────────────────────────────────────────────────────────────────

describe('_calculateServerTotals (via getEstimatedSpend)', () => {
  let request, h

  beforeEach(() => {
    vi.clearAllMocks()
    request = makeRequest()
    h = makeH()
    buildViewData.mockReturnValue({ viewData: true })
    resolveBackLinkOptions.mockReturnValue({})
  })

  it('calculates totals for source rows', async () => {
    buildEstimatedSpendRows.mockReturnValue([
      { kind: 'source', field: 'fcermGia' }
    ])
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        { financialYear: 2025, fcermGia: '1000' }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          serverTotals: expect.objectContaining({
            grandTotal: 1000,
            colTotals: [1000],
            rowTotals: { fcermGia: 1000 }
          })
        })
      })
    )
  })

  it('calculates totals for contributor rows', async () => {
    buildEstimatedSpendRows.mockReturnValue([
      { kind: 'group-heading', field: 'publicContributions' },
      {
        kind: 'contributor',
        contributorArrayField: 'publicContributors',
        contributorIndex: 0,
        contributorName: 'Alice'
      }
    ])
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          publicContributors: [{ name: 'Alice', amount: '500' }]
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          serverTotals: expect.objectContaining({
            grandTotal: 500,
            rowTotals: { 'publicContributors-0': 500 }
          })
        })
      })
    )
  })

  it('returns zero totals when no matching funding value row for year', async () => {
    buildEstimatedSpendRows.mockReturnValue([
      { kind: 'source', field: 'fcermGia' }
    ])
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        { financialYear: 2026, fcermGia: '1000' } // different year
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          serverTotals: expect.objectContaining({ grandTotal: 0 })
        })
      })
    )
  })

  it('handles non-numeric amounts gracefully in source rows', async () => {
    buildEstimatedSpendRows.mockReturnValue([
      { kind: 'source', field: 'fcermGia' }
    ])
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        { financialYear: 2025, fcermGia: null }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          serverTotals: expect.objectContaining({ grandTotal: 0 })
        })
      })
    )
  })

  it('handles contributor row where contributorArrayField is absent from fvRow (|| [] fallback)', async () => {
    buildEstimatedSpendRows.mockReturnValue([
      {
        kind: 'contributor',
        contributorArrayField: 'publicContributors',
        contributorIndex: 0,
        contributorName: 'Alice'
      }
    ])
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        { financialYear: 2025 /* no publicContributors field */ }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          serverTotals: expect.objectContaining({ grandTotal: 0 })
        })
      })
    )
  })

  it('handles contributor row where contributor name is not found (match is undefined, || 0 fallback)', async () => {
    buildEstimatedSpendRows.mockReturnValue([
      {
        kind: 'contributor',
        contributorArrayField: 'publicContributors',
        contributorIndex: 0,
        contributorName: 'NonExistent'
      }
    ])
    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          publicContributors: [{ name: 'Alice', amount: '500' }]
        }
      ]
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        additionalData: expect.objectContaining({
          serverTotals: expect.objectContaining({ grandTotal: 0 })
        })
      })
    )
  })

  it('falls back to 0 for start year and end year when session lacks financial year fields', async () => {
    buildEstimatedSpendRows.mockReturnValue([])
    getSessionData.mockReturnValue({
      // no FINANCIAL_START_YEAR or FINANCIAL_END_YEAR
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: []
    })
    await estimatedSpendController.getHandler(request, h)
    expect(buildViewData).toHaveBeenCalled()
  })
})
