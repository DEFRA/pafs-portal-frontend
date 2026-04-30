import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../../../common/helpers/error-renderer/index.js', () => ({
  extractJoiErrors: vi.fn(() => ({ field: 'error-message' }))
}))

vi.mock('../../../../common/constants/projects.js', () => ({
  REFERENCE_NUMBER_PARAM: '{referenceNumber}'
}))

vi.mock('../../helpers/config/funding-sources.js', () => ({
  FUNDING_SOURCES_CONFIG: {
    'funding-sources-public-contributors': {
      deleteRoute:
        '/project/{referenceNumber}/funding-sources-public-contributors/delete'
    }
  }
}))

const mockUpdateSessionData = vi.fn()
const mockGetUniqueContributorNamesFromDb = vi.fn(() => [])

vi.mock('../../helpers/project-utils.js', () => ({
  updateSessionData: (...args) => mockUpdateSessionData(...args),
  getUniqueContributorNamesFromDb: (...args) =>
    mockGetUniqueContributorNamesFromDb(...args)
}))

vi.mock('./navigation-helpers.js', () => ({
  CONTRIBUTOR_STEP_ROUTE: {
    'funding-sources-public-contributors':
      '/project/{referenceNumber}/funding-sources-public-contributors',
    'funding-sources-private-contributors':
      '/project/{referenceNumber}/funding-sources-private-contributors',
    'funding-sources-other-ea-contributors':
      '/project/{referenceNumber}/funding-sources-other-ea-contributors'
  }
}))

const mockParseContributorsPayload = vi.fn((payload, session) => session)

vi.mock('./payload-helpers.js', () => ({
  parseContributorsPayload: (...args) => mockParseContributorsPayload(...args)
}))

const mockLocalizeContributorErrorMessage = vi.fn((msg) => msg)

vi.mock('./estimated-spending-helpers.js', () => ({
  localizeContributorErrorMessage: (...args) =>
    mockLocalizeContributorErrorMessage(...args),
  CONTRIBUTOR_SPEND_GROUPS: [
    {
      sessionKey: '_publicContributorsSession',
      contributorType: 'public_contributions'
    },
    {
      sessionKey: '_privateContributorsSession',
      contributorType: 'private_contributions'
    },
    {
      sessionKey: '_otherEaContributorsSession',
      contributorType: 'other_ea_contributions'
    }
  ]
}))

// ─── Import under test ──────────────────────────────────────────────────────

import {
  validateContributorNames,
  loadContributors,
  handleAddAction,
  handleRemoveAction
} from './contributor-helpers.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

const STEP = 'funding-sources-public-contributors'
const SESSION_KEY = '_publicContributorsSession'
const NAMES_FIELD = 'publicContributorNames'

function createRequest(overrides = {}) {
  return {
    params: { referenceNumber: 'TEST001' },
    payload: {},
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('validateContributorNames', () => {
  const t = vi.fn((key) => key)
  const config = {
    schema: { validate: vi.fn(() => ({ error: null })) }
  }

  beforeEach(() => {
    config.schema.validate.mockReturnValue({ error: null })
  })

  it('returns required error when no non-empty names', () => {
    const { fieldErrors, hasError } = validateContributorNames(
      ['', ''],
      [],
      config,
      t
    )
    expect(hasError).toBe(true)
    expect(fieldErrors['contributors[0]']).toBe(
      'projects.funding_sources.contributors.errors.required'
    )
  })

  it('returns no errors for valid names', () => {
    const { fieldErrors, hasError } = validateContributorNames(
      ['Alice', 'Bob'],
      ['Alice', 'Bob'],
      config,
      t
    )
    expect(hasError).toBe(false)
    expect(Object.keys(fieldErrors)).toHaveLength(0)
  })

  it('skips empty names during schema validation', () => {
    validateContributorNames(['', 'Alice'], ['Alice'], config, t)
    expect(config.schema.validate).toHaveBeenCalledTimes(1)
    expect(config.schema.validate).toHaveBeenCalledWith('Alice', {
      abortEarly: false
    })
  })

  it('reports schema validation errors', () => {
    config.schema.validate.mockReturnValue({
      error: { details: [{ message: 'too long' }] }
    })
    const { fieldErrors, hasError } = validateContributorNames(
      ['BadName'],
      ['BadName'],
      config,
      t
    )
    expect(hasError).toBe(true)
    expect(fieldErrors['contributors[0]']).toBeDefined()
  })

  it('detects duplicate names case-insensitively', () => {
    const { fieldErrors, hasError } = validateContributorNames(
      ['Alice', 'alice'],
      ['Alice', 'alice'],
      config,
      t
    )
    expect(hasError).toBe(true)
    expect(fieldErrors['contributors[1]']).toBe(
      'projects.funding_sources.contributors.errors.duplicate'
    )
    // First occurrence is NOT marked as duplicate
    expect(fieldErrors['contributors[0]']).toBeUndefined()
  })

  it('skips empty names during duplicate check', () => {
    const { fieldErrors, hasError } = validateContributorNames(
      ['Alice', '', 'Bob'],
      ['Alice', 'Bob'],
      config,
      t
    )
    expect(hasError).toBe(false)
    expect(Object.keys(fieldErrors)).toHaveLength(0)
  })
})

describe('loadContributors', () => {
  it('returns contributors from session key when available', () => {
    const sessionData = { [SESSION_KEY]: ['Alice', 'Bob'] }
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('does not fall back to CSV names field (removed)', () => {
    const sessionData = {
      [SESSION_KEY]: [],
      [NAMES_FIELD]: 'Alice, Bob, Charlie'
    }
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    // CSV fallback removed - falls through to DB fallback then default ['']
    expect(result).toEqual([''])
  })

  it('returns default empty slot when no session and no DB contributors', () => {
    const sessionData = {
      [NAMES_FIELD]: 'Alice,,Bob'
    }
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    expect(result).toEqual([''])
  })

  it('ignores non-string CSV values', () => {
    const sessionData = { [NAMES_FIELD]: 123 }
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    // Falls through to DB fallback then to default ['']
    expect(result).toEqual([''])
  })

  it('ignores whitespace-only CSV', () => {
    const sessionData = { [NAMES_FIELD]: '   ' }
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    expect(result).toEqual([''])
  })

  it('falls back to DB contributors when session and CSV are empty', () => {
    mockGetUniqueContributorNamesFromDb.mockReturnValue(['Legacy Name'])
    const sessionData = {
      pafs_core_funding_contributors: [
        { contributorType: 'public_contributions', name: 'Legacy Name' }
      ]
    }
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    expect(result).toEqual(['Legacy Name'])
    expect(mockGetUniqueContributorNamesFromDb).toHaveBeenCalledWith(
      sessionData.pafs_core_funding_contributors,
      'public_contributions'
    )
  })

  it('skips DB fallback when step is not provided', () => {
    const sessionData = {}
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, null)
    expect(result).toEqual([''])
    expect(mockGetUniqueContributorNamesFromDb).not.toHaveBeenCalled()
  })

  it('skips DB fallback when no matching group for sessionKey', () => {
    const sessionData = {}
    const result = loadContributors(
      sessionData,
      '_unknownSession',
      NAMES_FIELD,
      STEP
    )
    expect(result).toEqual([''])
  })

  it('returns [""] when all fallbacks produce nothing', () => {
    mockGetUniqueContributorNamesFromDb.mockReturnValue([])
    const sessionData = {}
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    expect(result).toEqual([''])
  })

  it('handles missing pafs_core_funding_contributors gracefully', () => {
    mockGetUniqueContributorNamesFromDb.mockReturnValue([])
    const sessionData = {}
    const result = loadContributors(sessionData, SESSION_KEY, NAMES_FIELD, STEP)
    expect(mockGetUniqueContributorNamesFromDb).toHaveBeenCalledWith(
      [],
      'public_contributions'
    )
    expect(result).toEqual([''])
  })
})

describe('handleAddAction', () => {
  it('parses payload, trims, appends blank slot, and returns redirect URL', () => {
    mockParseContributorsPayload.mockReturnValue(['  Alice  ', '  Bob  '])
    const request = createRequest()

    const url = handleAddAction(request, ['Alice'], SESSION_KEY, STEP)

    expect(mockUpdateSessionData).toHaveBeenCalledWith(request, {
      [SESSION_KEY]: ['Alice', 'Bob', '']
    })
    expect(url).toBe('/project/TEST001/funding-sources-public-contributors')
  })

  it('converts non-string values to empty strings', () => {
    mockParseContributorsPayload.mockReturnValue([null, 'Bob'])
    const request = createRequest()

    handleAddAction(request, [], SESSION_KEY, STEP)

    expect(mockUpdateSessionData).toHaveBeenCalledWith(request, {
      [SESSION_KEY]: ['', 'Bob', '']
    })
  })
})

describe('handleRemoveAction', () => {
  it('saves current names and returns delete URL with index', () => {
    mockParseContributorsPayload.mockReturnValue(['Alice', 'Bob'])
    const request = createRequest()

    const url = handleRemoveAction(
      request,
      ['Alice', 'Bob'],
      SESSION_KEY,
      STEP,
      1
    )

    expect(mockUpdateSessionData).toHaveBeenCalledWith(request, {
      [SESSION_KEY]: ['Alice', 'Bob']
    })
    expect(url).toBe(
      '/project/TEST001/funding-sources-public-contributors/delete/1'
    )
  })

  it('trims names before saving', () => {
    mockParseContributorsPayload.mockReturnValue(['  Alice  ', '  Bob  '])
    const request = createRequest()

    handleRemoveAction(request, [], SESSION_KEY, STEP, 0)

    expect(mockUpdateSessionData).toHaveBeenCalledWith(request, {
      [SESSION_KEY]: ['Alice', 'Bob']
    })
  })

  it('converts non-string values to empty strings', () => {
    mockParseContributorsPayload.mockReturnValue([null, undefined])
    const request = createRequest()

    handleRemoveAction(request, [], SESSION_KEY, STEP, 0)

    expect(mockUpdateSessionData).toHaveBeenCalledWith(request, {
      [SESSION_KEY]: ['', '']
    })
  })
})
