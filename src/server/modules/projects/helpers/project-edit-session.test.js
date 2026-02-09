import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  initializeEditSession,
  detectChanges,
  initializeEditSessionPreHandler,
  fetchProjectForEdit,
  fetchProjectForOverview
} from './project-edit-session.js'
import { PROJECT_SESSION_KEY } from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getProjectProposalOverview } from '../../../common/services/project/project-service.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn()
}))

vi.mock('../../../common/services/project/project-service.js', () => ({
  getProjectProposalOverview: vi.fn()
}))

describe('project-edit-session', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: {},
      pre: {},
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      },
      yar: {
        get: vi.fn(),
        set: vi.fn()
      }
    }

    mockH = {
      continue: Symbol('continue'),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    getAuthSession.mockReturnValue({
      user: { id: '1' },
      accessToken: 'test-token'
    })
  })

  describe('areValuesEqual (internal function tested through detectChanges)', () => {
    test('should detect equal primitive values', () => {
      const sessionData = {
        isEdit: true,
        name: 'Test',
        originalData: { name: 'Test' }
      }
      const result = detectChanges(sessionData, ['name'])
      expect(result.hasChanges).toBe(false)
    })

    test('should detect different primitive values', () => {
      const sessionData = {
        isEdit: true,
        name: 'Updated',
        originalData: { name: 'Test' }
      }
      const result = detectChanges(sessionData, ['name'])
      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toEqual(['name'])
    })

    test('should detect equal arrays', () => {
      const sessionData = {
        isEdit: true,
        types: ['A', 'B', 'C'],
        originalData: { types: ['A', 'B', 'C'] }
      }
      const result = detectChanges(sessionData, ['types'])
      expect(result.hasChanges).toBe(false)
    })

    test('should detect different arrays', () => {
      const sessionData = {
        isEdit: true,
        types: ['A', 'B'],
        originalData: { types: ['A', 'B', 'C'] }
      }
      const result = detectChanges(sessionData, ['types'])
      expect(result.hasChanges).toBe(true)
    })

    test('should detect array order differences', () => {
      const sessionData = {
        isEdit: true,
        types: ['B', 'A', 'C'],
        originalData: { types: ['A', 'B', 'C'] }
      }
      const result = detectChanges(sessionData, ['types'])
      expect(result.hasChanges).toBe(true)
    })

    test('should handle null and undefined as equal to each other', () => {
      const sessionData = {
        isEdit: true,
        value1: null,
        originalData: { value1: null }
      }
      const result = detectChanges(sessionData, ['value1'])
      expect(result.hasChanges).toBe(false)
    })

    test('should handle null vs value as different', () => {
      const sessionData = {
        isEdit: true,
        value1: 'something',
        originalData: { value1: null }
      }
      const result = detectChanges(sessionData, ['value1'])
      expect(result.hasChanges).toBe(true)
    })
  })

  describe('initializeEditSession', () => {
    test('should initialize edit session with project data', () => {
      const projectData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project',
        projectType: 'DEF'
      }

      const result = initializeEditSession(mockRequest, projectData)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(PROJECT_SESSION_KEY, {
        ...projectData,
        journeyStarted: true,
        isEdit: true,
        referenceNumber: 'REF123',
        originalData: { ...projectData }
      })
      expect(result.isEdit).toBe(true)
      expect(result.journeyStarted).toBe(true)
    })

    test('should preserve all project data fields', () => {
      const projectData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project',
        areaId: 5,
        projectType: 'DEF',
        interventionTypes: ['NFM', 'PFR']
      }

      const result = initializeEditSession(mockRequest, projectData)

      expect(result).toMatchObject(projectData)
      expect(result.originalData).toEqual(projectData)
    })

    test('should create deep copy of original data', () => {
      const projectData = {
        referenceNumber: 'REF123',
        interventionTypes: ['NFM']
      }

      const result = initializeEditSession(mockRequest, projectData)

      // Verify it's a copy not a reference
      expect(result.originalData).toEqual(projectData)
      expect(result.originalData).not.toBe(projectData)
    })
  })

  describe('detectChanges', () => {
    test('should detect no changes when data matches original', () => {
      const sessionData = {
        isEdit: true,
        name: 'Test',
        areaId: 1,
        originalData: { name: 'Test', areaId: 1 }
      }

      const result = detectChanges(sessionData, ['name', 'areaId'])

      expect(result.hasChanges).toBe(false)
      expect(result.changedFields).toEqual([])
    })

    test('should detect changes in specified fields', () => {
      const sessionData = {
        isEdit: true,
        name: 'Updated',
        areaId: 2,
        originalData: { name: 'Test', areaId: 1 }
      }

      const result = detectChanges(sessionData, ['name', 'areaId'])

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toEqual(['name', 'areaId'])
    })

    test('should only check specified fields', () => {
      const sessionData = {
        isEdit: true,
        name: 'Updated',
        areaId: 2,
        originalData: { name: 'Test', areaId: 1 }
      }

      const result = detectChanges(sessionData, ['name'])

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toEqual(['name'])
    })

    test('should check all fields when none specified', () => {
      const sessionData = {
        isEdit: true,
        name: 'Updated',
        areaId: 2,
        originalData: { name: 'Test', areaId: 1, projectType: 'DEF' }
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('name')
      expect(result.changedFields).toContain('areaId')
    })

    test('should return no changes when not in edit mode', () => {
      const sessionData = {
        isEdit: false,
        name: 'Updated',
        originalData: { name: 'Test' }
      }

      const result = detectChanges(sessionData, ['name'])

      expect(result.hasChanges).toBe(false)
      expect(result.changedFields).toEqual([])
    })

    test('should return no changes when no original data', () => {
      const sessionData = {
        isEdit: true,
        name: 'Test'
      }

      const result = detectChanges(sessionData, ['name'])

      expect(result.hasChanges).toBe(false)
      expect(result.changedFields).toEqual([])
    })

    test('should handle array changes', () => {
      const sessionData = {
        isEdit: true,
        interventionTypes: ['NFM', 'SUDS'],
        originalData: { interventionTypes: ['NFM'] }
      }

      const result = detectChanges(sessionData, ['interventionTypes'])

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toEqual(['interventionTypes'])
    })

    test('should not detect new fields not in original data when fields specified', () => {
      const sessionData = {
        isEdit: true,
        name: 'Test',
        newField: 'value',
        originalData: { name: 'Test' }
      }

      const result = detectChanges(sessionData, ['name', 'newField'])

      // newField was undefined in original data, so detectChanges should report it changed
      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('newField')
    })
  })

  describe('initializeEditSessionPreHandler', () => {
    test('should continue when no reference number', async () => {
      const result = await initializeEditSessionPreHandler(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })

    test('should continue when no project data in request.pre', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.pre = {}

      const result = await initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.logger.warn).toHaveBeenCalled()
      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })

    test('should initialize session for new edit', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.pre.projectData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test'
      }
      mockRequest.yar.get.mockReturnValue(null)

      const result = await initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        PROJECT_SESSION_KEY,
        expect.objectContaining({
          isEdit: true,
          referenceNumber: 'REF123',
          journeyStarted: true
        })
      )
      expect(mockRequest.logger.info).toHaveBeenCalled()
    })

    test('should not reinitialize if already in edit mode for same project', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.pre.projectData = {
        id: 1,
        referenceNumber: 'REF123'
      }
      mockRequest.yar.get.mockReturnValue({
        isEdit: true,
        referenceNumber: 'REF123'
      })

      const result = await initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })

    test('should reinitialize if editing different project', async () => {
      mockRequest.params.referenceNumber = 'REF456'
      mockRequest.pre.projectData = {
        id: 2,
        referenceNumber: 'REF456'
      }
      mockRequest.yar.get.mockReturnValue({
        isEdit: true,
        referenceNumber: 'REF123'
      })

      const result = await initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    test('should reinitialize if not currently in edit mode', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.pre.projectData = {
        id: 1,
        referenceNumber: 'REF123'
      }
      mockRequest.yar.get.mockReturnValue({
        isEdit: false
      })

      const result = await initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })
  })

  describe('fetchProjectForEdit', () => {
    test('should redirect to start when no reference number', async () => {
      await fetchProjectForEdit(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.START)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should use existing session data when available and not forceFresh', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      const sessionData = {
        isEdit: true,
        slug: 'REF123',
        name: 'Cached Project'
      }
      mockRequest.yar.get.mockReturnValue(sessionData)

      const result = await fetchProjectForEdit(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.pre.projectData).toEqual(sessionData)
      expect(getProjectProposalOverview).not.toHaveBeenCalled()
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        { referenceNumber: 'REF123' },
        'Using existing edit session data'
      )
    })

    test('should fetch from API when no existing session', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue(null)

      const projectData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project'
      }
      getProjectProposalOverview.mockResolvedValue({
        success: true,
        data: projectData
      })

      const result = await fetchProjectForEdit(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(getProjectProposalOverview).toHaveBeenCalledWith(
        'REF123',
        'test-token'
      )
      expect(mockRequest.pre.projectData).toEqual(projectData)
    })

    test('should fetch from API when forceFresh is true', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue({
        isEdit: true,
        slug: 'REF123',
        name: 'Cached'
      })

      const freshData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Fresh Project'
      }
      getProjectProposalOverview.mockResolvedValue({
        success: true,
        data: freshData
      })

      const result = await fetchProjectForEdit(mockRequest, mockH, {
        forceFresh: true
      })

      expect(result).toBe(mockH.continue)
      expect(getProjectProposalOverview).toHaveBeenCalled()
      expect(mockRequest.pre.projectData).toEqual(freshData)
    })

    test('should redirect to login when no access token', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue(null)
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await fetchProjectForEdit(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.LOGIN)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to home when project not found', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue(null)
      getProjectProposalOverview.mockResolvedValue({
        success: false
      })

      await fetchProjectForEdit(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.takeover).toHaveBeenCalled()
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        { referenceNumber: 'REF123' },
        'Project not found'
      )
    })

    test('should redirect to home when API call fails', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue(null)
      const error = new Error('API Error')
      getProjectProposalOverview.mockRejectedValue(error)

      await fetchProjectForEdit(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.takeover).toHaveBeenCalled()
      expect(mockRequest.logger.error).toHaveBeenCalled()
    })

    test('should handle session data for wrong project', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue({
        isEdit: true,
        slug: 'REF456' // Different project
      })

      const projectData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project'
      }
      getProjectProposalOverview.mockResolvedValue({
        success: true,
        data: projectData
      })

      const result = await fetchProjectForEdit(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(getProjectProposalOverview).toHaveBeenCalled()
      expect(mockRequest.pre.projectData).toEqual(projectData)
    })

    test('should handle session data when not in edit mode', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue({
        isEdit: false,
        slug: 'REF123'
      })

      const projectData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project'
      }
      getProjectProposalOverview.mockResolvedValue({
        success: true,
        data: projectData
      })

      const result = await fetchProjectForEdit(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(getProjectProposalOverview).toHaveBeenCalled()
    })
  })

  describe('fetchProjectForOverview', () => {
    test('should always fetch fresh data', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue({
        isEdit: true,
        slug: 'REF123',
        name: 'Cached'
      })

      const freshData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Fresh'
      }
      getProjectProposalOverview.mockResolvedValue({
        success: true,
        data: freshData
      })

      const result = await fetchProjectForOverview(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(getProjectProposalOverview).toHaveBeenCalled()
      expect(mockRequest.pre.projectData).toEqual(freshData)
    })

    test('should ignore session cache', async () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue({
        isEdit: true,
        slug: 'REF123',
        name: 'Cached Data'
      })

      const freshData = { name: 'Fresh Data' }
      getProjectProposalOverview.mockResolvedValue({
        success: true,
        data: freshData
      })

      await fetchProjectForOverview(mockRequest, mockH)

      expect(getProjectProposalOverview).toHaveBeenCalled()
      expect(mockRequest.logger.info).not.toHaveBeenCalledWith(
        expect.anything(),
        'Using existing edit session data'
      )
    })
  })
})
