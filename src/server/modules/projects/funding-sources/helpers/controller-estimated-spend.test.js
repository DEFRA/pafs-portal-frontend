import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../../../common/constants/common.js', () => ({
  PROJECT_VIEWS: {
    FUNDING_SOURCES_ESTIMATED_SPEND:
      'modules/projects/funding-sources/estimated-spend'
  }
}))

vi.mock('../../../../common/constants/projects.js', () => ({
  PROJECT_PAYLOAD_FIELDS: {
    FINANCIAL_START_YEAR: 'financialStartYear',
    FINANCIAL_END_YEAR: 'financialEndYear',
    FUNDING_VALUES: 'fundingValues',
    FINANCIAL_YEAR: 'financialYear',
    FCERM_GIA: 'fcermGia',
    LOCAL_LEVY: 'localLevy',
    PUBLIC_CONTRIBUTIONS: 'publicContributions',
    PRIVATE_CONTRIBUTIONS: 'privateContributions',
    OTHER_EA_CONTRIBUTIONS: 'otherEaContributions',
    NOT_YET_IDENTIFIED: 'notYetIdentified',
    ASSET_REPLACEMENT_ALLOWANCE: 'assetReplacementAllowance',
    ENVIRONMENT_STATUTORY_FUNDING: 'environmentStatutoryFunding',
    FREQUENTLY_FLOODED_COMMUNITIES: 'frequentlyFloodedCommunities',
    OTHER_ADDITIONAL_GRANT_IN_AID: 'otherAdditionalGrantInAid',
    OTHER_GOVERNMENT_DEPARTMENT: 'otherGovernmentDepartment',
    RECOVERY: 'recovery',
    SUMMER_ECONOMIC_FUND: 'summerEconomicFund',
    PUBLIC_CONTRIBUTOR_NAMES: 'publicContributorNames',
    PRIVATE_CONTRIBUTOR_NAMES: 'privateContributorNames',
    OTHER_EA_CONTRIBUTOR_NAMES: 'otherEaContributorNames'
  },
  PROJECT_PAYLOAD_LEVELS: {
    FUNDING_SOURCES_ESTIMATED_SPEND: 'funding-sources-estimated-spend'
  },
  PROJECT_STEPS: {
    FUNDING_SOURCES_ESTIMATED_SPEND: 'funding-sources-estimated-spend'
  },
  REFERENCE_NUMBER_PARAM: '{referenceNumber}'
}))

vi.mock('../../../../common/constants/routes.js', () => ({
  ROUTES: {
    PROJECT: {
      EDIT: {
        FUNDING_SOURCES: {
          ESTIMATED_SPEND:
            '/project/{referenceNumber}/funding-sources-estimated-spend'
        }
      }
    }
  }
}))

const mockSchema = {
  validate: vi.fn(() => ({ error: null }))
}

vi.mock('../../helpers/config/funding-sources.js', () => ({
  FUNDING_SOURCES_CONFIG: {
    'funding-sources-estimated-spend': {
      localKeyPrefix: 'projects.funding_sources.estimated_spend',
      schema: vi.fn(() => mockSchema),
      fieldType: 'spending-table'
    }
  }
}))

const mockSaveProjectWithErrorHandling = vi.fn()
vi.mock('../../helpers/project-submission.js', () => ({
  saveProjectWithErrorHandling: (...args) =>
    mockSaveProjectWithErrorHandling(...args)
}))

const mockSessionData = {}
const mockGetSessionData = vi.fn(() => mockSessionData)
const mockUpdateSessionData = vi.fn()
const mockNavigateToProjectOverview = vi.fn(() => 'overview-redirect')
const mockBuildViewData = vi.fn((req, opts) => ({
  ...opts.additionalData,
  localKeyPrefix: opts.localKeyPrefix
}))
const mockBuildFinancialYearLabel = vi.fn((y) => `${y}/${y + 1}`)
const mockBuildIdToYearMap = vi.fn(() => ({}))
const mockBuildContributorsByYear = vi.fn(() => ({}))
const mockFormatNumberWithCommas = vi.fn((n) => String(n))
const mockGetCurrentFinancialYearStartYear = vi.fn(() => 2024)

vi.mock('../../helpers/project-utils.js', () => ({
  buildViewData: (...args) => mockBuildViewData(...args),
  buildFinancialYearLabel: (...args) => mockBuildFinancialYearLabel(...args),
  buildIdToYearMap: (...args) => mockBuildIdToYearMap(...args),
  buildContributorsByYear: (...args) => mockBuildContributorsByYear(...args),
  formatNumberWithCommas: (...args) => mockFormatNumberWithCommas(...args),
  getCurrentFinancialYearStartYear: (...args) =>
    mockGetCurrentFinancialYearStartYear(...args),
  getSessionData: (...args) => mockGetSessionData(...args),
  navigateToProjectOverview: (...args) =>
    mockNavigateToProjectOverview(...args),
  updateSessionData: (...args) => mockUpdateSessionData(...args)
}))

const mockResolveBackLinkOptions = vi.fn(() => ({
  backLinkUrl: '/back'
}))
vi.mock('./navigation-helpers.js', () => ({
  resolveBackLinkOptions: (...args) => mockResolveBackLinkOptions(...args)
}))

const mockSanitiseFundingValueRow = vi.fn((r) => r)
const mockSetSourceTotals = vi.fn((r) => r)
const mockStripEmptyContributors = vi.fn((r) => ({
  row: r,
  indexMaps: {}
}))
const mockSanitiseZeros = vi.fn((rows) => rows)
const mockParseFundingValuesPayload = vi.fn((p) => p.fundingValues || [])

vi.mock('./payload-helpers.js', () => ({
  sanitiseFundingValueRow: (...args) => mockSanitiseFundingValueRow(...args),
  setSourceTotalsFromContributorArrays: (...args) =>
    mockSetSourceTotals(...args),
  stripEmptyContributorEntriesWithMapping: (...args) =>
    mockStripEmptyContributors(...args),
  sanitiseZerosFromValidatedRows: (...args) => mockSanitiseZeros(...args),
  parseFundingValuesPayload: (...args) => mockParseFundingValuesPayload(...args)
}))

const mockBuildEstimatedSpendRows = vi.fn(() => [])
const mockGetContributorNames = vi.fn(() => [])
const mockGetSelectedSourceFields = vi.fn(() => ['fcermGia'])

vi.mock('./estimated-spending-helpers.js', () => ({
  buildEstimatedSpendRows: (...args) => mockBuildEstimatedSpendRows(...args),
  getContributorNames: (...args) => mockGetContributorNames(...args),
  getSelectedEstimatedSpendSourceFields: (...args) =>
    mockGetSelectedSourceFields(...args),
  CONTRIBUTOR_SPEND_GROUPS: [
    {
      enabledField: 'publicContributions',
      namesField: 'publicContributorNames',
      sessionKey: '_publicContributorsSession',
      sourceField: 'publicContributions',
      contributorArrayField: 'publicContributors',
      contributorType: 'public_contributions'
    },
    {
      enabledField: 'privateContributions',
      namesField: 'privateContributorNames',
      sessionKey: '_privateContributorsSession',
      sourceField: 'privateContributions',
      contributorArrayField: 'privateContributors',
      contributorType: 'private_contributions'
    },
    {
      enabledField: 'otherEaContributions',
      namesField: 'otherEaContributorNames',
      sessionKey: '_otherEaContributorsSession',
      sourceField: 'otherEaContributions',
      contributorArrayField: 'otherEaContributors',
      contributorType: 'other_ea_contributions'
    }
  ]
}))

// ─── Import under test ──────────────────────────────────────────────────────

import { estimatedSpendController } from './controller-estimated-spend.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

function createRequest(overrides = {}) {
  return {
    params: { referenceNumber: 'TEST001' },
    payload: {},
    t: vi.fn((key) => key),
    ...overrides
  }
}

function createH() {
  const viewFn = vi.fn(() => 'view-response')
  const redirectFn = vi.fn(() => ({
    takeover: vi.fn(() => 'redirect-takeover')
  }))
  return { view: viewFn, redirect: redirectFn }
}

function setSessionData(data) {
  Object.keys(mockSessionData).forEach((k) => delete mockSessionData[k])
  Object.assign(mockSessionData, {
    financialStartYear: 2024,
    financialEndYear: 2026,
    ...data
  })
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  setSessionData({})
  mockSaveProjectWithErrorHandling.mockResolvedValue(null)
  mockSchema.validate.mockReturnValue({ error: null })
})

describe('estimatedSpendController', () => {
  // ─── GET handler ────────────────────────────────────────────────────────

  describe('getHandler', () => {
    it('renders the estimated spend view', async () => {
      const request = createRequest()
      const h = createH()

      const result = await estimatedSpendController.getHandler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/estimated-spend',
        expect.objectContaining({
          step: 'funding-sources-estimated-spend'
        })
      )
      expect(result).toBe('view-response')
    })

    it('includes financial years in view data', async () => {
      setSessionData({
        financialStartYear: 2024,
        financialEndYear: 2025
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            financialYears: expect.arrayContaining([
              { value: 2024, label: '2024/2025' }
            ])
          })
        })
      )
    })

    it('loads existing values from session when present', async () => {
      const fv = [{ financialYear: 2024, fcermGia: '100' }]
      setSessionData({ fundingValues: fv })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            existingValues: fv
          })
        })
      )
    })

    it('builds funding values from project data when session is empty', async () => {
      setSessionData({
        pafs_core_funding_values: [{ financialYear: 2024, fcermGia: '200' }]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('falls back to current financial year when start/end not set', async () => {
      setSessionData({
        financialStartYear: 0,
        financialEndYear: 0
      })
      mockGetCurrentFinancialYearStartYear.mockReturnValue(2024)
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockGetCurrentFinancialYearStartYear).toHaveBeenCalled()
    })
  })

  // ─── POST handler ───────────────────────────────────────────────────────

  describe('postHandler', () => {
    it('parses, sanitises, and sets totals on payload values', async () => {
      const rawRows = [{ financialYear: 2024, fcermGia: '100' }]
      mockParseFundingValuesPayload.mockReturnValue(rawRows)
      const request = createRequest({
        payload: { fundingValues: rawRows }
      })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(mockParseFundingValuesPayload).toHaveBeenCalledWith(
        request.payload
      )
      expect(mockSanitiseFundingValueRow).toHaveBeenCalledWith(rawRows[0])
      expect(mockSetSourceTotals).toHaveBeenCalled()
    })

    it('updates session data with funding values', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(mockUpdateSessionData).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ fundingValues: expect.any(Array) })
      )
    })

    it('redirects on update-totals action', async () => {
      mockParseFundingValuesPayload.mockReturnValue([])
      const request = createRequest({
        payload: { action: 'update-totals' }
      })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        '/project/TEST001/funding-sources-estimated-spend'
      )
      expect(result).toBe('redirect-takeover')
    })

    it('returns error view when validation fails', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [{ path: [], type: 'any.required' }]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/estimated-spend',
        expect.objectContaining({
          globalError: expect.any(String)
        })
      )
      expect(result).toBe('view-response')
    })

    it('returns error when contributor has amount 0', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: '0'
            }
          ]
        }
      ])
      setSessionData({ publicContributions: true })
      mockGetContributorNames.mockReturnValue(['Alice'])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: '0'
            }
          ]
        },
        indexMaps: {}
      })

      const request = createRequest({ payload: {} })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(h.view).toHaveBeenCalled()
      expect(result).toBe('view-response')
    })

    it('passes when contributor has valid non-zero amount', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: '500'
            }
          ]
        }
      ])
      setSessionData({ publicContributions: true })
      mockGetContributorNames.mockReturnValue(['Alice'])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: '500'
            }
          ]
        },
        indexMaps: {}
      })

      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(mockSaveProjectWithErrorHandling).toHaveBeenCalled()
    })

    it('returns error when contributor has empty amount', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: ''
            }
          ]
        }
      ])
      setSessionData({ publicContributions: true })
      mockGetContributorNames.mockReturnValue(['Alice'])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: ''
            }
          ]
        },
        indexMaps: {}
      })

      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(h.view).toHaveBeenCalled()
    })

    it('returns error when contributor has null amount', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: null
            }
          ]
        }
      ])
      setSessionData({ publicContributions: true })
      mockGetContributorNames.mockReturnValue(['Alice'])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [
            {
              name: 'Alice',
              contributorType: 'public_contributions',
              amount: null
            }
          ]
        },
        indexMaps: {}
      })

      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(h.view).toHaveBeenCalled()
    })

    it('skips coverage check for disabled contributor groups', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      setSessionData({ publicContributions: false })

      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(mockGetContributorNames).not.toHaveBeenCalled()
      expect(mockSaveProjectWithErrorHandling).toHaveBeenCalled()
    })

    it('checks all contributor groups when multiple are enabled', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [{ name: 'A', amount: '100' }],
          privateContributors: [{ name: 'B', amount: '200' }]
        }
      ])
      setSessionData({
        publicContributions: true,
        privateContributions: true
      })
      mockGetContributorNames
        .mockReturnValueOnce(['A'])
        .mockReturnValueOnce(['B'])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [{ name: 'A', amount: '100' }],
          privateContributors: [{ name: 'B', amount: '200' }]
        },
        indexMaps: {}
      })

      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(mockSaveProjectWithErrorHandling).toHaveBeenCalled()
    })

    it('handles row with no contributor array (not an array)', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      setSessionData({ publicContributions: true })
      mockGetContributorNames.mockReturnValue(['Alice'])
      mockStripEmptyContributors.mockReturnValue({
        row: { financialYear: 2024 },
        indexMaps: {}
      })

      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      // No publicContributors array → coverage fails → error view
      expect(h.view).toHaveBeenCalled()
    })

    it('returns error view when contributor coverage check fails', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      setSessionData({ publicContributions: true })
      mockGetContributorNames.mockReturnValue(['Alice'])
      // No contributor amounts → coverage fail
      mockStripEmptyContributors.mockReturnValue({
        row: { financialYear: 2024 },
        indexMaps: {}
      })

      const request = createRequest({ payload: {} })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(h.view).toHaveBeenCalled()
      expect(result).toBe('view-response')
    })

    it('sanitises zeros from validated rows on success', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        { financialYear: 2024, fcermGia: '0' }
      ])
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      expect(mockSanitiseZeros).toHaveBeenCalled()
    })

    it('saves project and navigates to overview on success', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      const request = createRequest({ payload: {} })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(mockSaveProjectWithErrorHandling).toHaveBeenCalledWith(
        request,
        h,
        'funding-sources-estimated-spend',
        expect.any(Object),
        'modules/projects/funding-sources/estimated-spend'
      )
      expect(mockNavigateToProjectOverview).toHaveBeenCalledWith('TEST001', h)
      expect(result).toBe('overview-redirect')
    })

    it('returns save error when save fails', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      mockSaveProjectWithErrorHandling.mockResolvedValue('save-error')
      const request = createRequest({ payload: {} })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(result).toBe('save-error')
    })

    it('handles field-level validation errors with contributor index mapping', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [{ name: 'Alice', amount: 'abc' }]
        }
      ])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [{ name: 'Alice', amount: 'abc' }]
        },
        indexMaps: { publicContributors: { 0: 0 } }
      })
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: [0, 'publicContributors', 0, 'amount'],
              type: 'number.base'
            }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(h.view).toHaveBeenCalled()
      expect(result).toBe('view-response')
    })

    it('handles source field validation errors', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        { financialYear: 2024, fcermGia: 'bad' }
      ])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [{ path: [0, 'fcermGia'], type: 'number.base' }]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      const result = await estimatedSpendController.postHandler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/estimated-spend',
        expect.objectContaining({
          fieldErrors: expect.objectContaining({
            fcermGia: expect.any(String)
          }),
          cellErrors: expect.objectContaining({
            'fcermGia-0': true
          })
        })
      )
      expect(result).toBe('view-response')
    })

    it('reports auto-computed source field errors in origin flow', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [{ path: [0, 'publicContributions'], type: 'number.base' }]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewCall = h.view.mock.calls[0]
      const viewData = viewCall[1]
      expect(viewData.fieldErrors).toHaveProperty('publicContributions')
      expect(viewData.cellErrors).toHaveProperty('publicContributions-0', true)
    })

    it('handles string.max validation errors with max_digits suffix', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        { financialYear: 2024, fcermGia: '999999999999' }
      ])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [{ path: [0, 'fcermGia'], type: 'string.max' }]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewCall = h.view.mock.calls[0]
      const viewData = viewCall[1]
      expect(viewData.fieldErrors.fcermGia).toContain('max_digits')
    })

    it('remaps contributor stripped index to original index for cell errors', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [
            { name: '', amount: '' },
            { name: 'Bob', amount: '999999999999' }
          ]
        }
      ])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [{ name: 'Bob', amount: '999999999999' }]
        },
        // stripped idx 0 maps back to original idx 1
        indexMaps: { publicContributors: [1] }
      })
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: [0, 'publicContributors', 0, 'amount'],
              type: 'string.max'
            }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewData = h.view.mock.calls[0][1]
      expect(viewData.cellErrors).toHaveProperty('publicContributors-1-0', true)
      expect(viewData.cellErrors).not.toHaveProperty('publicContributors-0-0')
      expect(viewData.fieldErrors.publicContributors).toContain('max_digits')
    })

    it('falls back to stripped index when contributor mapping is missing', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [{ name: 'Bob', amount: '999999999999' }]
        }
      ])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [{ name: 'Bob', amount: '999999999999' }]
        },
        indexMaps: {}
      })
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: [0, 'publicContributors', 0, 'amount'],
              type: 'number.base'
            }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewData = h.view.mock.calls[0][1]
      expect(viewData.cellErrors).toHaveProperty('publicContributors-0-0', true)
      expect(viewData.fieldErrors).toHaveProperty('publicContributors')
    })

    it('falls back when mapping array exists but index is undefined', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [{ name: 'Bob', amount: '999999999999' }]
        }
      ])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [{ name: 'Bob', amount: '999999999999' }]
        },
        indexMaps: { publicContributors: [] }
      })
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: [0, 'publicContributors', 2, 'amount'],
              type: 'number.base'
            }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewData = h.view.mock.calls[0][1]
      expect(viewData.cellErrors).toHaveProperty('publicContributors-2-0', true)
      expect(viewData.fieldErrors).toHaveProperty('publicContributors')
    })

    it('handles contributor errors even when contributorIndexMaps is empty', async () => {
      mockParseFundingValuesPayload.mockReturnValue([])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: [0, 'publicContributors', 0, 'amount'],
              type: 'number.base'
            }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewData = h.view.mock.calls[0][1]
      expect(viewData.cellErrors).toHaveProperty('publicContributors-0-0', true)
      expect(viewData.fieldErrors).toHaveProperty('publicContributors')
    })

    it('does not duplicate contributor cell/field errors for repeated details', async () => {
      mockParseFundingValuesPayload.mockReturnValue([
        {
          financialYear: 2024,
          publicContributors: [{ name: 'Alice', amount: 'oops' }]
        }
      ])
      mockStripEmptyContributors.mockReturnValue({
        row: {
          financialYear: 2024,
          publicContributors: [{ name: 'Alice', amount: 'oops' }]
        },
        indexMaps: { publicContributors: [0] }
      })
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            { path: [0, 'publicContributors', 0, 'amount'], type: 'number.base' },
            { path: [0, 'publicContributors', 0, 'amount'], type: 'string.max' }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewData = h.view.mock.calls[0][1]
      expect(viewData.cellErrors).toEqual(
        expect.objectContaining({ 'publicContributors-0-0': true })
      )
      expect(Object.keys(viewData.cellErrors)).toHaveLength(1)
      expect(viewData.fieldErrors.publicContributors).toContain('invalid')
    })

    it('handles unclassified detail with fallback fieldKey', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['someNestedObj', 'deepField'],
              type: 'number.base'
            }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewCall = h.view.mock.calls[0]
      const viewData = viewCall[1]
      expect(viewData.fieldErrors).toHaveProperty('deepField')
    })

    it('handles detail with empty last path segment', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [{ path: ['someObj', ''], type: 'number.base' }]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      // Empty last segment → classifyValidationDetail returns null → ignored
      const viewCall = h.view.mock.calls[0]
      const viewData = viewCall[1]
      expect(Object.keys(viewData.fieldErrors)).toHaveLength(0)
    })
  })

  // ─── buildFundingValuesFromProjectData edge cases ────────────────────────

  describe('buildFundingValuesFromProjectData (via getHandler)', () => {
    it('fills missing year rows within the financial range', async () => {
      setSessionData({
        financialStartYear: 2024,
        financialEndYear: 2026,
        pafs_core_funding_values: [{ financialYear: 2024, fcermGia: '100' }]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      const viewData = mockBuildViewData.mock.calls[0][1]
      const years = viewData.additionalData.existingValues.map(
        (r) => r.financialYear
      )
      expect(years).toContain(2024)
      // 2025 and 2026 should be filled in
      expect(years).toContain(2025)
      expect(years).toContain(2026)
    })

    it('filters out-of-range years when explicit range is set', async () => {
      setSessionData({
        financialStartYear: 2025,
        financialEndYear: 2026,
        pafs_core_funding_values: [
          { financialYear: 2024, fcermGia: '50' },
          { financialYear: 2025, fcermGia: '100' }
        ]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      const viewData = mockBuildViewData.mock.calls[0][1]
      const years = viewData.additionalData.existingValues.map(
        (r) => r.financialYear
      )
      expect(years).not.toContain(2024)
      expect(years).toContain(2025)
    })

    it('returns empty array when no DB values and no start year', async () => {
      setSessionData({
        financialStartYear: 0,
        financialEndYear: 0
      })
      mockGetCurrentFinancialYearStartYear.mockReturnValue(0)
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('handles endYear < startYear gracefully (fillMissingYearRows early return)', async () => {
      setSessionData({
        financialStartYear: 2026,
        financialEndYear: 2024,
        pafs_core_funding_values: [{ financialYear: 2025 }]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('handles missing endYear (falls back to startYear)', async () => {
      setSessionData({
        financialStartYear: 2024,
        financialEndYear: 0
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('handles contributor with null amount from DB', async () => {
      mockBuildContributorsByYear.mockReturnValue({
        2024: [
          {
            name: 'Alice',
            contributorType: 'public_contributions',
            amount: null
          }
        ]
      })
      setSessionData({
        pafs_core_funding_values: [{ financialYear: 2024 }],
        pafs_core_funding_contributors: []
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('handles unknown contributor type from DB data', async () => {
      mockBuildContributorsByYear.mockReturnValue({
        2024: [{ name: 'X', contributorType: 'unknown_type', amount: 10 }]
      })
      setSessionData({
        pafs_core_funding_values: [{ financialYear: 2024 }],
        pafs_core_funding_contributors: []
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('does not filter out-of-range years when explicit range not set', async () => {
      setSessionData({
        financialStartYear: 0,
        financialEndYear: 0,
        pafs_core_funding_values: [
          { financialYear: 2020 },
          { financialYear: 2030 }
        ]
      })
      mockGetCurrentFinancialYearStartYear.mockReturnValue(2024)
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('categorises contributors from DB data into typed groups', async () => {
      mockBuildContributorsByYear.mockReturnValue({
        2024: [
          {
            name: 'Alice',
            contributorType: 'public_contributions',
            amount: 100
          },
          {
            name: 'Corp',
            contributorType: 'private_contributions',
            amount: 200
          }
        ]
      })
      setSessionData({
        pafs_core_funding_values: [{ financialYear: 2024 }],
        pafs_core_funding_contributors: [
          {
            fundingValueId: '1',
            name: 'Alice',
            contributorType: 'public_contributions',
            amount: 100
          }
        ]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildIdToYearMap).toHaveBeenCalled()
      expect(mockBuildContributorsByYear).toHaveBeenCalled()
    })
  })

  // ─── calculateServerTotals (via getHandler view data) ───────────────────

  describe('calculateServerTotals (via getHandler)', () => {
    it('calculates row, column, and grand totals', async () => {
      mockBuildEstimatedSpendRows.mockReturnValue([
        { kind: 'source', field: 'fcermGia' }
      ])
      setSessionData({
        fundingValues: [
          { financialYear: 2024, fcermGia: '100' },
          { financialYear: 2025, fcermGia: '200' }
        ]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      const viewData = mockBuildViewData.mock.calls[0][1]
      expect(viewData.additionalData.serverTotals).toBeDefined()
    })

    it('skips group-heading rows in totals calculation', async () => {
      mockBuildEstimatedSpendRows.mockReturnValue([
        { kind: 'group-heading', label: 'Public' },
        { kind: 'source', field: 'fcermGia' }
      ])
      setSessionData({
        fundingValues: [{ financialYear: 2024, fcermGia: '50' }]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })

    it('handles contributor kind rows in totals', async () => {
      mockBuildEstimatedSpendRows.mockReturnValue([
        {
          kind: 'contributor',
          contributorArrayField: 'publicContributors',
          contributorName: 'Alice',
          contributorIndex: 0
        }
      ])
      setSessionData({
        fundingValues: [
          {
            financialYear: 2024,
            publicContributors: [{ name: 'Alice', amount: '75' }]
          }
        ]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      expect(mockBuildViewData).toHaveBeenCalled()
    })
  })

  // ─── getRowValue edge cases (via totals) ────────────────────────────────

  describe('getRowValue edge cases (via getHandler)', () => {
    it('returns 0 for unknown row kind', async () => {
      mockBuildEstimatedSpendRows.mockReturnValue([
        { kind: 'unknown', field: 'test' }
      ])
      setSessionData({
        fundingValues: [{ financialYear: 2024, test: '100' }]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      const viewData = mockBuildViewData.mock.calls[0][1]
      const totals = viewData.additionalData.serverTotals
      expect(totals.grandTotal).toBe(0)
    })

    it('handles contributor row with no matching name', async () => {
      mockBuildEstimatedSpendRows.mockReturnValue([
        {
          kind: 'contributor',
          contributorArrayField: 'publicContributors',
          contributorName: 'Nobody',
          contributorIndex: 0
        }
      ])
      setSessionData({
        fundingValues: [
          {
            financialYear: 2024,
            publicContributors: [{ name: 'Alice', amount: '75' }]
          }
        ]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      const viewData = mockBuildViewData.mock.calls[0][1]
      expect(viewData.additionalData.serverTotals.grandTotal).toBe(0)
    })

    it('handles contributor row with missing contributor array', async () => {
      mockBuildEstimatedSpendRows.mockReturnValue([
        {
          kind: 'contributor',
          contributorArrayField: 'publicContributors',
          contributorName: 'Alice',
          contributorIndex: 0
        }
      ])
      setSessionData({
        fundingValues: [{ financialYear: 2024 }]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      const viewData = mockBuildViewData.mock.calls[0][1]
      expect(viewData.additionalData.serverTotals.grandTotal).toBe(0)
    })

    it('strips non-numeric chars from source values', async () => {
      mockBuildEstimatedSpendRows.mockReturnValue([
        { kind: 'source', field: 'fcermGia' }
      ])
      setSessionData({
        fundingValues: [{ financialYear: 2024, fcermGia: '£1,234' }]
      })
      const request = createRequest()
      const h = createH()

      await estimatedSpendController.getHandler(request, h)

      const viewData = mockBuildViewData.mock.calls[0][1]
      expect(viewData.additionalData.serverTotals.grandTotal).toBe(1234)
    })
  })

  // ─── Duplicate global/field errors ──────────────────────────────────────

  describe('duplicate error handling', () => {
    it('only sets global error once even with multiple global details', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            { path: [], type: 'any.required' },
            { path: [0], type: 'any.required' }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewData = h.view.mock.calls[0][1]
      expect(viewData.globalError).toBeTruthy()
    })

    it('only sets field error once for duplicate field paths', async () => {
      mockParseFundingValuesPayload.mockReturnValue([{ financialYear: 2024 }])
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            { path: [0, 'fcermGia'], type: 'number.base' },
            { path: [0, 'fcermGia'], type: 'string.max' }
          ]
        }
      })
      const request = createRequest({ payload: {} })
      const h = createH()

      await estimatedSpendController.postHandler(request, h)

      const viewData = h.view.mock.calls[0][1]
      // First error wins, second is duplicate → ignored
      expect(viewData.fieldErrors.fcermGia).toContain('invalid')
    })
  })
})
