import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../../../common/constants/common.js', () => ({
  PROJECT_VIEWS: {
    FUNDING_SOURCES_PUBLIC_CONTRIBUTORS:
      'modules/projects/funding-sources/contributors',
    FUNDING_SOURCES_CONTRIBUTOR_DELETE:
      'modules/projects/funding-sources/delete-contributor'
  }
}))

vi.mock('../../../../common/constants/projects.js', () => ({
  PROJECT_PAYLOAD_FIELDS: {
    PUBLIC_CONTRIBUTOR_NAMES: 'publicContributorNames'
  },
  PROJECT_STEPS: {
    FUNDING_SOURCES_PUBLIC_CONTRIBUTORS: 'funding-sources-public-contributors',
    FUNDING_SOURCES_PRIVATE_CONTRIBUTORS:
      'funding-sources-private-contributors',
    FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS:
      'funding-sources-other-ea-contributors'
  },
  REFERENCE_NUMBER_PARAM: '{referenceNumber}',
  CONTRIBUTOR_SESSION_KEY: {
    'funding-sources-public-contributors': '_publicContributorsSession',
    'funding-sources-private-contributors': '_privateContributorsSession',
    'funding-sources-other-ea-contributors': '_otherEaContributorsSession'
  },
  CONTRIBUTOR_NAMES_FIELD: {
    'funding-sources-public-contributors': 'publicContributorNames',
    'funding-sources-private-contributors': 'privateContributorNames',
    'funding-sources-other-ea-contributors': 'otherEaContributorNames'
  },
  CONTRIBUTOR_LEVEL: {
    'funding-sources-public-contributors': 'PUBLIC_SECTOR_CONTRIBUTORS',
    'funding-sources-private-contributors': 'PRIVATE_SECTOR_CONTRIBUTORS',
    'funding-sources-other-ea-contributors':
      'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS'
  }
}))

vi.mock('../../../../common/constants/routes.js', () => ({
  ROUTES: {
    PROJECT: {
      EDIT: {
        FUNDING_SOURCES: {
          PUBLIC_SECTOR_CONTRIBUTORS:
            '/project/{referenceNumber}/funding-sources-public-contributors',
          PRIVATE_SECTOR_CONTRIBUTORS:
            '/project/{referenceNumber}/funding-sources-private-contributors',
          OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS:
            '/project/{referenceNumber}/funding-sources-other-ea-contributors'
        }
      }
    }
  }
}))

vi.mock('../../helpers/config/funding-sources.js', () => ({
  FUNDING_SOURCES_CONFIG: {
    'funding-sources-public-contributors': {
      gateField: 'publicContributions',
      localKeyPrefix: 'projects.funding_sources.public_sector_contributors',
      schema: { validate: vi.fn(() => ({ error: null })) },
      deleteRoute:
        '/project/{referenceNumber}/funding-sources-public-contributors/delete',
      fieldName: 'publicContributorNames'
    },
    'funding-sources-private-contributors': {
      gateField: 'privateContributions',
      localKeyPrefix: 'projects.funding_sources.private_sector_contributors',
      schema: { validate: vi.fn(() => ({ error: null })) },
      deleteRoute:
        '/project/{referenceNumber}/funding-sources-private-contributors/delete',
      fieldName: 'privateContributorNames'
    },
    'funding-sources-other-ea-contributors': {
      gateField: 'otherEaContributions',
      localKeyPrefix: 'projects.funding_sources.other_ea_contributors',
      schema: { validate: vi.fn(() => ({ error: null })) },
      deleteRoute:
        '/project/{referenceNumber}/funding-sources-other-ea-contributors/delete',
      fieldName: 'otherEaContributorNames'
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
const mockBuildViewData = vi.fn((req, opts) => ({
  ...opts.additionalData,
  localKeyPrefix: opts.localKeyPrefix
}))
const mockNavigateToProjectOverview = vi.fn(() => 'overview-redirect')
const mockUpdateSessionData = vi.fn()

vi.mock('../../helpers/project-utils.js', () => ({
  buildViewData: (...args) => mockBuildViewData(...args),
  getSessionData: (...args) => mockGetSessionData(...args),
  navigateToProjectOverview: (...args) =>
    mockNavigateToProjectOverview(...args),
  updateSessionData: (...args) => mockUpdateSessionData(...args)
}))

const mockResolveBackLinkOptions = vi.fn(() => ({ backLinkUrl: '/back' }))
const mockNextRouteAfterContributors = vi.fn(() => '/project/TEST001/overview')

vi.mock('./navigation-helpers.js', () => ({
  resolveBackLinkOptions: (...args) => mockResolveBackLinkOptions(...args),
  nextRouteAfterContributors: (...args) =>
    mockNextRouteAfterContributors(...args)
}))

const mockParseContributorsPayload = vi.fn((p, s) => s)

vi.mock('./payload-helpers.js', () => ({
  parseContributorsPayload: (...args) => mockParseContributorsPayload(...args)
}))

const mockValidateContributorNames = vi.fn(() => ({
  fieldErrors: {},
  hasError: false
}))
const mockLoadContributors = vi.fn(() => ['Alice'])
const mockHandleAddAction = vi.fn(() => '/project/TEST001/redirect')
const mockHandleRemoveAction = vi.fn(() => '/project/TEST001/delete/0')

vi.mock('./contributor-helpers.js', () => ({
  validateContributorNames: (...args) => mockValidateContributorNames(...args),
  loadContributors: (...args) => mockLoadContributors(...args),
  handleAddAction: (...args) => mockHandleAddAction(...args),
  handleRemoveAction: (...args) => mockHandleRemoveAction(...args)
}))

vi.mock('./estimated-spending-helpers.js', () => ({
  CONTRIBUTOR_SPEND_GROUPS: [
    {
      sessionKey: '_publicContributorsSession',
      contributorType: 'public_contributions'
    }
  ]
}))

// ─── Import under test ──────────────────────────────────────────────────────

import {
  publicContributorsController,
  publicContributorsDeleteController,
  privateContributorsController,
  otherEaContributorsController,
  privateContributorsDeleteController,
  otherEaContributorsDeleteController
} from './controller-contributors.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

const STEP = 'funding-sources-public-contributors'

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
  const takeoverFn = vi.fn(() => 'redirect-takeover')
  const redirectFn = vi.fn(() => ({ takeover: takeoverFn }))
  return { view: viewFn, redirect: redirectFn, _takeover: takeoverFn }
}

function setSessionData(data) {
  Object.keys(mockSessionData).forEach((k) => delete mockSessionData[k])
  Object.assign(mockSessionData, data)
}

beforeEach(() => {
  vi.clearAllMocks()
  setSessionData({ publicContributions: true })
  mockSaveProjectWithErrorHandling.mockResolvedValue(null)
  mockParseContributorsPayload.mockImplementation((p, s) => s)
  mockValidateContributorNames.mockReturnValue({
    fieldErrors: {},
    hasError: false
  })
  mockLoadContributors.mockReturnValue(['Alice'])
  mockHandleAddAction.mockReturnValue('/project/TEST001/redirect')
  mockHandleRemoveAction.mockReturnValue('/project/TEST001/delete/0')
  mockNavigateToProjectOverview.mockReturnValue('overview-redirect')
  mockNextRouteAfterContributors.mockReturnValue('/project/TEST001/overview')
})

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('publicContributorsController', () => {
  describe('getHandler', () => {
    it('renders the contributors view', async () => {
      const request = createRequest()
      const h = createH()

      const result = await publicContributorsController.getHandler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/contributors',
        expect.objectContaining({
          step: STEP
        })
      )
      expect(result).toBe('view-response')
    })

    it('redirects to overview when gate field is false', async () => {
      setSessionData({ publicContributions: false })
      const request = createRequest()
      const h = createH()

      const result = await publicContributorsController.getHandler(request, h)

      expect(mockNavigateToProjectOverview).toHaveBeenCalledWith('TEST001', h)
      expect(result).toBe('overview-redirect')
    })

    it('loads contributors and updates session', async () => {
      const request = createRequest()
      const h = createH()

      await publicContributorsController.getHandler(request, h)

      expect(mockLoadContributors).toHaveBeenCalled()
      expect(mockUpdateSessionData).toHaveBeenCalled()
    })
  })

  describe('postHandler', () => {
    it('redirects to overview when gate field is false', async () => {
      setSessionData({ publicContributions: false })
      const request = createRequest()
      const h = createH()

      const result = await publicContributorsController.postHandler(request, h)

      expect(mockNavigateToProjectOverview).toHaveBeenCalledWith('TEST001', h)
      expect(result).toBe('overview-redirect')
    })

    it('delegates to handleAddAction on add action', async () => {
      const request = createRequest({ payload: { action: 'add' } })
      const h = createH()

      const result = await publicContributorsController.postHandler(request, h)

      expect(mockHandleAddAction).toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith('/project/TEST001/redirect')
      expect(result).toBe('redirect-takeover')
    })

    it('delegates to handleRemoveAction on remove: action', async () => {
      const request = createRequest({
        payload: { action: 'remove:1' }
      })
      const h = createH()

      const result = await publicContributorsController.postHandler(request, h)

      expect(mockHandleRemoveAction).toHaveBeenCalledWith(
        request,
        expect.any(Array),
        '_publicContributorsSession',
        STEP,
        1
      )
      expect(h.redirect).toHaveBeenCalledWith('/project/TEST001/delete/0')
      expect(result).toBe('redirect-takeover')
    })

    it('validates and saves on continue action', async () => {
      mockParseContributorsPayload.mockReturnValue(['Alice'])
      const request = createRequest({
        payload: { action: 'continue' }
      })
      const h = createH()

      const result = await publicContributorsController.postHandler(request, h)

      expect(mockValidateContributorNames).toHaveBeenCalled()
      expect(mockSaveProjectWithErrorHandling).toHaveBeenCalledWith(
        request,
        h,
        'PUBLIC_SECTOR_CONTRIBUTORS',
        expect.any(Object),
        'modules/projects/funding-sources/contributors'
      )
      expect(result).toBe('redirect-takeover')
    })

    it('re-renders with errors when validation fails', async () => {
      mockParseContributorsPayload.mockReturnValue([''])
      mockValidateContributorNames.mockReturnValue({
        fieldErrors: { 'contributors[0]': 'required' },
        hasError: true
      })
      const request = createRequest({
        payload: { action: 'continue' }
      })
      const h = createH()

      const result = await publicContributorsController.postHandler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/contributors',
        expect.objectContaining({
          fieldErrors: { 'contributors[0]': 'required' }
        })
      )
      expect(result).toBe('view-response')
    })

    it('returns save error when save fails', async () => {
      mockParseContributorsPayload.mockReturnValue(['Alice'])
      mockSaveProjectWithErrorHandling.mockResolvedValue('save-error')
      setSessionData({
        publicContributions: true,
        _publicContributorsSession: ['Alice']
      })
      const request = createRequest({
        payload: { action: 'continue' }
      })
      const h = createH()

      const result = await publicContributorsController.postHandler(request, h)

      expect(result).toBe('save-error')
    })

    it('uses session contributors default when sessionKey is empty', async () => {
      setSessionData({ publicContributions: true })
      mockParseContributorsPayload.mockReturnValue(['Alice'])
      const request = createRequest({
        payload: { action: 'continue' }
      })
      const h = createH()

      await publicContributorsController.postHandler(request, h)

      expect(mockParseContributorsPayload).toHaveBeenCalledWith(
        request.payload,
        ['']
      )
    })
  })
})

describe('publicContributorsDeleteController', () => {
  describe('getHandler', () => {
    it('renders the delete confirmation page', async () => {
      const request = createRequest({
        params: { referenceNumber: 'TEST001', index: '0' }
      })
      const h = createH()

      const result = await publicContributorsDeleteController.getHandler(
        request,
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/delete-contributor',
        expect.objectContaining({
          step: STEP,
          index: 0,
          contributorNumber: 1,
          contributorName: 'Alice'
        })
      )
      expect(result).toBe('view-response')
    })

    it('handles out-of-range index gracefully', async () => {
      const request = createRequest({
        params: { referenceNumber: 'TEST001', index: '99' }
      })
      const h = createH()

      const result = await publicContributorsDeleteController.getHandler(
        request,
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/delete-contributor',
        expect.objectContaining({
          contributorName: ''
        })
      )
      expect(result).toBe('view-response')
    })
  })

  describe('postHandler', () => {
    it('removes contributor and redirects on confirm yes', async () => {
      mockLoadContributors.mockReturnValue(['Alice', 'Bob'])
      const request = createRequest({
        params: { referenceNumber: 'TEST001', index: '0' },
        payload: { confirm: 'yes' }
      })
      const h = createH()

      const result = await publicContributorsDeleteController.postHandler(
        request,
        h
      )

      expect(mockUpdateSessionData).toHaveBeenCalledWith(request, {
        _publicContributorsSession: ['Bob']
      })
      expect(h.redirect).toHaveBeenCalledWith(
        '/project/TEST001/funding-sources-public-contributors'
      )
      expect(result).toBe('redirect-takeover')
    })

    it('pushes empty slot when deleting the last contributor', async () => {
      mockLoadContributors.mockReturnValue(['Alice'])
      const request = createRequest({
        params: { referenceNumber: 'TEST001', index: '0' },
        payload: { confirm: 'yes' }
      })
      const h = createH()

      await publicContributorsDeleteController.postHandler(request, h)

      expect(mockUpdateSessionData).toHaveBeenCalledWith(request, {
        _publicContributorsSession: ['']
      })
    })

    it('does not remove on confirm no', async () => {
      mockLoadContributors.mockReturnValue(['Alice', 'Bob'])
      const request = createRequest({
        params: { referenceNumber: 'TEST001', index: '0' },
        payload: { confirm: 'no' }
      })
      const h = createH()

      const result = await publicContributorsDeleteController.postHandler(
        request,
        h
      )

      expect(mockUpdateSessionData).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalled()
      expect(result).toBe('redirect-takeover')
    })

    it('re-renders with error when confirm is invalid', async () => {
      mockLoadContributors.mockReturnValue(['Alice'])
      const request = createRequest({
        params: { referenceNumber: 'TEST001', index: '0' },
        payload: { confirm: 'maybe' }
      })
      const h = createH()

      const result = await publicContributorsDeleteController.postHandler(
        request,
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/delete-contributor',
        expect.objectContaining({
          fieldErrors: { confirm: true }
        })
      )
      expect(result).toBe('view-response')
    })

    it('re-renders with error when confirm is missing', async () => {
      mockLoadContributors.mockReturnValue(['Alice'])
      const request = createRequest({
        params: { referenceNumber: 'TEST001', index: '0' },
        payload: {}
      })
      const h = createH()

      const result = await publicContributorsDeleteController.postHandler(
        request,
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        'modules/projects/funding-sources/delete-contributor',
        expect.objectContaining({
          fieldErrors: { confirm: true }
        })
      )
      expect(result).toBe('view-response')
    })
  })
})

describe('privateContributorsController', () => {
  it('getHandler delegates with private step', async () => {
    setSessionData({ privateContributions: true })
    const request = createRequest()
    const h = createH()

    const result = await privateContributorsController.getHandler(request, h)

    expect(mockLoadContributors).toHaveBeenCalled()
    expect(result).toBe('view-response')
  })

  it('postHandler delegates with private step', async () => {
    setSessionData({ privateContributions: true })
    mockParseContributorsPayload.mockReturnValue(['Corp'])
    const request = createRequest({ payload: { action: 'continue' } })
    const h = createH()

    const result = await privateContributorsController.postHandler(request, h)

    expect(mockSaveProjectWithErrorHandling).toHaveBeenCalledWith(
      request,
      h,
      'PRIVATE_SECTOR_CONTRIBUTORS',
      expect.any(Object),
      'modules/projects/funding-sources/contributors'
    )
    expect(result).toBe('redirect-takeover')
  })
})

describe('otherEaContributorsController', () => {
  it('getHandler delegates with otherEa step', async () => {
    setSessionData({ otherEaContributions: true })
    const request = createRequest()
    const h = createH()

    const result = await otherEaContributorsController.getHandler(request, h)

    expect(mockLoadContributors).toHaveBeenCalled()
    expect(result).toBe('view-response')
  })

  it('postHandler delegates with otherEa step', async () => {
    setSessionData({ otherEaContributions: true })
    mockParseContributorsPayload.mockReturnValue(['EA Partner'])
    const request = createRequest({ payload: { action: 'continue' } })
    const h = createH()

    const result = await otherEaContributorsController.postHandler(request, h)

    expect(mockSaveProjectWithErrorHandling).toHaveBeenCalledWith(
      request,
      h,
      'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS',
      expect.any(Object),
      'modules/projects/funding-sources/contributors'
    )
    expect(result).toBe('redirect-takeover')
  })
})

describe('privateContributorsDeleteController', () => {
  it('getHandler renders delete page for private contributors', async () => {
    setSessionData({ privateContributions: true })
    const request = createRequest({
      params: { referenceNumber: 'TEST001', index: '0' }
    })
    const h = createH()

    const result = await privateContributorsDeleteController.getHandler(
      request,
      h
    )

    expect(h.view).toHaveBeenCalled()
    expect(result).toBe('view-response')
  })

  it('postHandler confirms delete for private contributors', async () => {
    setSessionData({ privateContributions: true })
    mockLoadContributors.mockReturnValue(['Alice', 'Bob'])
    const request = createRequest({
      params: { referenceNumber: 'TEST001', index: '0' },
      payload: { confirm: 'yes' }
    })
    const h = createH()

    const result = await privateContributorsDeleteController.postHandler(
      request,
      h
    )

    expect(mockUpdateSessionData).toHaveBeenCalled()
    expect(result).toBe('redirect-takeover')
  })
})

describe('otherEaContributorsDeleteController', () => {
  it('getHandler renders delete page for otherEa contributors', async () => {
    setSessionData({ otherEaContributions: true })
    const request = createRequest({
      params: { referenceNumber: 'TEST001', index: '0' }
    })
    const h = createH()

    const result = await otherEaContributorsDeleteController.getHandler(
      request,
      h
    )

    expect(h.view).toHaveBeenCalled()
    expect(result).toBe('view-response')
  })

  it('postHandler confirms delete for otherEa contributors', async () => {
    setSessionData({ otherEaContributions: true })
    mockLoadContributors.mockReturnValue(['Alice', 'Bob'])
    const request = createRequest({
      params: { referenceNumber: 'TEST001', index: '0' },
      payload: { confirm: 'yes' }
    })
    const h = createH()

    const result = await otherEaContributorsDeleteController.postHandler(
      request,
      h
    )

    expect(mockUpdateSessionData).toHaveBeenCalled()
    expect(result).toBe('redirect-takeover')
  })
})

describe('syncSessionContributorNames (via postHandler save flow)', () => {
  it('renames contributor in session when name changes', async () => {
    mockParseContributorsPayload.mockReturnValue(['Bob'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice'],
      pafs_core_funding_contributors: [
        {
          contributorType: 'public_contributions',
          name: 'Alice',
          amount: '100'
        }
      ]
    })
    const request = createRequest({
      payload: { action: 'continue' }
    })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    // syncSessionContributorNames should rename Alice → Bob
    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeDefined()
    expect(syncCall[1].pafs_core_funding_contributors).toEqual([
      expect.objectContaining({ name: 'Bob' })
    ])
  })

  it('deletes contributor from session when removed without replacement', async () => {
    mockParseContributorsPayload.mockReturnValue(['Alice'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice', 'Bob'],
      pafs_core_funding_contributors: [
        {
          contributorType: 'public_contributions',
          name: 'Alice',
          amount: '100'
        },
        {
          contributorType: 'public_contributions',
          name: 'Bob',
          amount: '200'
        }
      ]
    })
    const request = createRequest({
      payload: { action: 'continue' }
    })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    // Bob was removed — should be deleted from session contributors
    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeDefined()
    expect(syncCall[1].pafs_core_funding_contributors).toEqual([
      expect.objectContaining({
        name: 'Alice',
        contributorType: 'public_contributions'
      })
    ])
  })

  it('calls sync but makes no changes when no existing names match type', async () => {
    mockParseContributorsPayload.mockReturnValue(['Alice'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice'],
      pafs_core_funding_contributors: [
        { contributorType: 'unknown_type', name: 'X', amount: '50' }
      ]
    })
    const request = createRequest({
      payload: { action: 'continue' }
    })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    // Sync runs but existing public names = [], so added=['Alice'], removed=[]
    // The loop doesn't change anything; the array is passed through unchanged
    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeDefined()
    expect(syncCall[1].pafs_core_funding_contributors).toEqual([
      { contributorType: 'unknown_type', name: 'X', amount: '50' }
    ])
  })

  it('skips sync when pafs_core_funding_contributors is empty', async () => {
    mockParseContributorsPayload.mockReturnValue(['Alice'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice'],
      pafs_core_funding_contributors: []
    })
    const request = createRequest({
      payload: { action: 'continue' }
    })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeUndefined()
  })

  it('skips sync when pafs_core_funding_contributors is not an array', async () => {
    mockParseContributorsPayload.mockReturnValue(['Alice'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice']
    })
    const request = createRequest({
      payload: { action: 'continue' }
    })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeUndefined()
  })

  it('skips sync when names have not changed', async () => {
    mockParseContributorsPayload.mockReturnValue(['Alice', 'Bob'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice', 'Bob'],
      pafs_core_funding_contributors: [
        { contributorType: 'public_contributions', name: 'Alice', amount: '1' },
        { contributorType: 'public_contributions', name: 'Bob', amount: '2' }
      ]
    })
    const request = createRequest({
      payload: { action: 'continue' }
    })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeUndefined()
  })

  it('skips sync when sessionKey has no matching CONTRIBUTOR_SPEND_GROUPS entry', async () => {
    // Use private contributors — our mock only has a group for public
    mockParseContributorsPayload.mockReturnValue(['NewCorp'])
    setSessionData({
      privateContributions: true,
      _privateContributorsSession: ['OldCorp'],
      pafs_core_funding_contributors: [
        {
          contributorType: 'private_contributions',
          name: 'OldCorp',
          amount: '500'
        }
      ]
    })
    const request = createRequest({ payload: { action: 'continue' } })
    const h = createH()

    await privateContributorsController.postHandler(request, h)

    // The !group early return should fire — no sync updateSessionData call
    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeUndefined()
  })

  it('handles multiple new additions with no removals', async () => {
    mockParseContributorsPayload.mockReturnValue(['Alice', 'Zara', 'Bob'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice'],
      pafs_core_funding_contributors: [
        { contributorType: 'public_contributions', name: 'Alice', amount: '1' }
      ]
    })
    const request = createRequest({ payload: { action: 'continue' } })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeDefined()
    expect(syncCall[1].pafs_core_funding_contributors).toEqual([
      { contributorType: 'public_contributions', name: 'Alice', amount: '1' }
    ])
  })

  it('handles multiple removals exceeding additions', async () => {
    mockParseContributorsPayload.mockReturnValue(['NewOne'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice', 'Bob', 'Charlie'],
      pafs_core_funding_contributors: [
        { contributorType: 'public_contributions', name: 'Alice', amount: '1' },
        { contributorType: 'public_contributions', name: 'Bob', amount: '2' },
        {
          contributorType: 'public_contributions',
          name: 'Charlie',
          amount: '3'
        }
      ]
    })
    const request = createRequest({ payload: { action: 'continue' } })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    // removed = ['Alice','Bob','Charlie'], added = ['NewOne']
    // Alice→NewOne (rename), Bob deleted, Charlie deleted
    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeDefined()
    expect(syncCall[1].pafs_core_funding_contributors).toEqual([
      { contributorType: 'public_contributions', name: 'NewOne', amount: '1' }
    ])
  })

  it('preserves other contributor types during rename', async () => {
    mockParseContributorsPayload.mockReturnValue(['Bob'])
    setSessionData({
      publicContributions: true,
      _publicContributorsSession: ['Alice'],
      pafs_core_funding_contributors: [
        { contributorType: 'public_contributions', name: 'Alice', amount: '1' },
        {
          contributorType: 'private_contributions',
          name: 'PrivCorp',
          amount: '99'
        }
      ]
    })
    const request = createRequest({
      payload: { action: 'continue' }
    })
    const h = createH()

    await publicContributorsController.postHandler(request, h)

    const syncCall = mockUpdateSessionData.mock.calls.find(
      ([, data]) => 'pafs_core_funding_contributors' in data
    )
    expect(syncCall).toBeDefined()
    const updated = syncCall[1].pafs_core_funding_contributors
    expect(updated).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Bob',
          contributorType: 'public_contributions'
        }),
        expect.objectContaining({
          name: 'PrivCorp',
          contributorType: 'private_contributions'
        })
      ])
    )
  })
})
