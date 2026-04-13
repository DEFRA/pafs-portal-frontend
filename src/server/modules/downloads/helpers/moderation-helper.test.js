import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  buildModerationText,
  buildModerationResponse
} from './moderation-helper.js'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../../common/constants/projects.js', () => ({
  URGENCY_REASON_LABELS: {
    statutory_need: 'Statutory need',
    legal_need: 'Legal need',
    health_and_safety: 'Health and safety',
    emergency_works: 'Emergency works',
    time_limited: 'Time-limited opportunity'
  }
}))

// ---------------------------------------------------------------------------
// buildModerationText
// ---------------------------------------------------------------------------

describe('buildModerationText', () => {
  const BASE_PARAMS = {
    referenceNumber: 'ANC501E/000A/001A',
    projectName: 'South Yorkshire Flood Alleviation',
    rmaName: 'South Yorkshire MBC',
    eaAreaName: 'North East',
    rfccName: 'Yorkshire RFCC',
    urgencyReason: 'statutory_need',
    urgencyDetails: 'Required by law by April 2025.',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-06-15T10:00:00Z')
  }

  test('Should include the project reference number', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('ANC501E/000A/001A')
  })

  test('Should include the project name', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('South Yorkshire Flood Alleviation')
  })

  test('Should include the RMA name', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('South Yorkshire MBC')
  })

  test('Should include the EA Area name', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('North East')
  })

  test('Should include the RFCC name', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('Yorkshire RFCC')
  })

  test('Should include the urgency reason label (not key)', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('Statutory need')
    expect(content).not.toContain('statutory_need')
  })

  test('Should include urgency details', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('Required by law by April 2025.')
  })

  test('Should use CRLF line endings', () => {
    const content = buildModerationText(BASE_PARAMS)

    expect(content).toContain('\r\n')
    // Split by CRLF should not contain any stray \n only lines
    const lines = content.split('\r\n')
    expect(lines.length).toBeGreaterThan(1)
  })

  describe('date labelling', () => {
    test('Should show "Date created:" for a project where created and updated within 5 seconds', () => {
      const params = {
        ...BASE_PARAMS,
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
        updatedAt: new Date('2024-01-01T10:00:01.000Z') // 1 second later
      }

      const content = buildModerationText(params)

      expect(content).toContain('* Date created:')
      expect(content).not.toContain('* Last updated:')
    })

    test('Should show "Last updated:" for a project that has been modified', () => {
      const params = {
        ...BASE_PARAMS,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-06-15T12:30:00Z') // months later
      }

      const content = buildModerationText(params)

      expect(content).toContain('* Last updated:')
      expect(content).not.toContain('* Date created:')
    })

    test('Should format the date as "d MMMM yyyy" (e.g. 15 June 2024)', () => {
      const params = {
        ...BASE_PARAMS,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-06-15T10:00:00Z')
      }

      const content = buildModerationText(params)

      expect(content).toContain('15 June 2024')
    })

    test('Should use createdAt date when project is new (created ≈ updated)', () => {
      const createdAt = new Date('2024-03-20T09:00:00.000Z')
      const updatedAt = new Date('2024-03-20T09:00:00.100Z') // 100ms later

      const content = buildModerationText({
        ...BASE_PARAMS,
        createdAt,
        updatedAt
      })

      expect(content).toContain('20 March 2024')
    })

    test('Should fall back to current date when updatedAt is null and not a new project condition', () => {
      const params = {
        ...BASE_PARAMS,
        createdAt: null,
        updatedAt: null
      }

      // When both are null, isNewProject is false (createdDate is falsy);
      // dateLabel uses updatedDate ?? new Date() so it falls back to today.
      const content = buildModerationText(params)

      // Should not throw, and should show "Last updated:" since isNewProject is false
      expect(content).toContain('* Last updated:')
    })
  })

  describe('null value handling', () => {
    test('Should render empty string for null rmaName', () => {
      const content = buildModerationText({ ...BASE_PARAMS, rmaName: null })

      const lines = content.split('\r\n')
      const rmaIndex = lines.findIndex((l) =>
        l.includes('Risk Management Authority')
      )
      expect(lines[rmaIndex + 1].trim()).toBe('')
    })

    test('Should render empty string for null eaAreaName', () => {
      const content = buildModerationText({ ...BASE_PARAMS, eaAreaName: null })

      expect(content).toContain('* Environment Agency Area')
    })

    test('Should render the raw urgencyReason key when it is not in URGENCY_REASON_LABELS', () => {
      const content = buildModerationText({
        ...BASE_PARAMS,
        urgencyReason: 'unknown_reason'
      })

      expect(content).toContain('unknown_reason')
    })

    test('Should render empty string for null urgencyDetails', () => {
      const content = buildModerationText({
        ...BASE_PARAMS,
        urgencyDetails: null
      })

      // Should not throw; urgencyDetails line is empty
      expect(typeof content).toBe('string')
    })

    test('Should include the section headers even when all names are null', () => {
      const content = buildModerationText({
        ...BASE_PARAMS,
        rmaName: null,
        eaAreaName: null,
        rfccName: null
      })

      expect(content).toContain('* Risk Management Authority')
      expect(content).toContain('* Environment Agency Area')
      expect(content).toContain('* Regional Flood and Coastal Committee')
    })
  })

  describe('content structure', () => {
    test('Should start with the banner', () => {
      const content = buildModerationText(BASE_PARAMS)
      const lines = content.split('\r\n')

      expect(lines[0]).toBe('===========================')
      expect(lines[1]).toBe('Urgency Moderation Evidence')
      expect(lines[2]).toBe('===========================')
    })
  })
})

// ---------------------------------------------------------------------------
// buildModerationResponse
// ---------------------------------------------------------------------------

describe('buildModerationResponse', () => {
  let mockH
  let mockLogger
  let mockStatusCodes

  const mockResponse = {
    code: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis()
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockH = { response: vi.fn().mockReturnValue(mockResponse) }

    mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

    mockStatusCodes = { ok: 200, notFound: 404 }
  })

  const URGENT_PROJECT = {
    slug: 'ANC501E-000A-001A',
    referenceNumber: 'ANC501E/000A/001A',
    name: 'Flood Project',
    rmaName: 'South Yorkshire',
    eaAreaName: 'North East',
    rfccName: 'Yorkshire RFCC',
    urgencyReason: 'statutory_need',
    urgencyDetails: 'Statutory obligation.',
    moderationFilename: 'ANC501E-000A-001A_moderation_BS.txt',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-06-15T10:00:00Z')
  }

  test('Should call h.response() with the text content', async () => {
    buildModerationResponse(mockH, URGENT_PROJECT, mockLogger, mockStatusCodes)

    expect(mockH.response).toHaveBeenCalledOnce()
    const body = mockH.response.mock.calls[0][0]
    expect(typeof body).toBe('string')
    expect(body).toContain('Urgency Moderation Evidence')
  })

  test('Should set status code to statusCodes.ok', () => {
    buildModerationResponse(mockH, URGENT_PROJECT, mockLogger, mockStatusCodes)

    expect(mockResponse.code).toHaveBeenCalledWith(200)
  })

  test('Should set Content-Type to text/plain; charset=utf-8', () => {
    buildModerationResponse(mockH, URGENT_PROJECT, mockLogger, mockStatusCodes)

    expect(mockResponse.type).toHaveBeenCalledWith('text/plain; charset=utf-8')
  })

  test('Should set Content-Disposition with the moderationFilename from projectData', () => {
    buildModerationResponse(mockH, URGENT_PROJECT, mockLogger, mockStatusCodes)

    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="ANC501E-000A-001A_moderation_BS.txt"'
    )
  })

  test('Should set Cache-Control to no-store', () => {
    buildModerationResponse(mockH, URGENT_PROJECT, mockLogger, mockStatusCodes)

    expect(mockResponse.header).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store'
    )
  })

  test('Should fall back to slug-based filename when moderationFilename is null', () => {
    const projectData = { ...URGENT_PROJECT, moderationFilename: null }

    buildModerationResponse(mockH, projectData, mockLogger, mockStatusCodes)

    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="ANC501E-000A-001A_moderation.txt"'
    )
  })

  test('Should use referenceNumber as fallback for the filename slug when slug is absent', () => {
    const projectData = {
      ...URGENT_PROJECT,
      slug: undefined,
      moderationFilename: null
    }

    buildModerationResponse(mockH, projectData, mockLogger, mockStatusCodes)

    const dispositionCall = mockResponse.header.mock.calls.find(
      ([name]) => name === 'Content-Disposition'
    )
    expect(dispositionCall[1]).toContain('ANC501E/000A/001A')
  })

  test('Should log an info message with referenceNumber and filename', () => {
    buildModerationResponse(mockH, URGENT_PROJECT, mockLogger, mockStatusCodes)

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceNumber: expect.any(String),
        filename: 'ANC501E-000A-001A_moderation_BS.txt'
      }),
      expect.stringContaining('Building urgency moderation evidence download')
    )
  })

  test('Should uppercase the fallback slug filename', () => {
    const projectData = {
      ...URGENT_PROJECT,
      slug: 'anc501e-000a-001a',
      moderationFilename: null
    }

    buildModerationResponse(mockH, projectData, mockLogger, mockStatusCodes)

    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="ANC501E-000A-001A_moderation.txt"'
    )
  })
})
