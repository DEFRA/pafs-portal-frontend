import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  requireRmaUser,
  noEditSessionRequired,
  requireJourneyStarted,
  requireProjectNameSet,
  requireProjectAreaSet,
  requireProjectTypeSet,
  requireInterventionTypesSet,
  requirePrimaryInterventionTypeSet,
  requireFinancialStartYearSet,
  canViewProposal,
  canEditProposal,
  requireViewPermission,
  requireEditPermission
} from './permissions.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  getSessionData,
  loggedInUserAreas,
  requiredInterventionTypesForProjectType
} from './project-utils.js'
import { getParentAreas } from '../../../common/helpers/areas/areas-helper.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STATUS
} from '../../../common/constants/projects.js'

vi.mock('../../../common/helpers/auth/auth-middleware.js')
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('./project-utils.js')
vi.mock('../../../common/helpers/areas/areas-helper.js')

describe('permissions helper - comprehensive', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      server: {
        logger: { warn: vi.fn() },
        app: { areasByType: {} }
      }
    }

    mockH = {
      continue: Symbol('continue'),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    requireAuth.mockResolvedValue(mockH.continue)
  })

  describe('requireRmaUser', () => {
    test('should allow RMA users', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true }
      })

      const result = await requireRmaUser(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should redirect non-RMA users', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '3', isRma: false, isPso: true }
      })

      await requireRmaUser(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.takeover).toHaveBeenCalled()
    })
  })

  describe('noEditSessionRequired', () => {
    test('should continue when no edit session', () => {
      getSessionData.mockReturnValue({ isEdit: false })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      const result = noEditSessionRequired(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should redirect when edit session active', () => {
      getSessionData.mockReturnValue({ isEdit: true })
      getAuthSession.mockReturnValue({ user: { id: '2' } })

      noEditSessionRequired(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.START)
    })
  })

  describe('requireJourneyStarted', () => {
    test('should continue when journey started', async () => {
      getSessionData.mockReturnValue({ journeyStarted: true })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      const result = await requireJourneyStarted(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should redirect when not started', async () => {
      getSessionData.mockReturnValue({})
      getAuthSession.mockReturnValue({ user: { id: '2' } })

      await requireJourneyStarted(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.START)
    })
  })

  describe('requireProjectNameSet', () => {
    test('should continue when name set', async () => {
      getSessionData.mockReturnValue({ name: 'Test' })
      const result = await requireProjectNameSet(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect when name not set', async () => {
      getSessionData.mockReturnValue({})
      await requireProjectNameSet(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.NAME)
    })
  })

  describe('requireProjectAreaSet', () => {
    test('should continue when areaId set', async () => {
      getSessionData.mockReturnValue({ areaId: '5' })
      const result = await requireProjectAreaSet(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect to area when multiple areas', async () => {
      getSessionData.mockReturnValue({})
      loggedInUserAreas.mockReturnValue([{ areaId: '5' }, { areaId: '6' }])
      await requireProjectAreaSet(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.AREA)
    })

    test('should redirect to name when single area', async () => {
      getSessionData.mockReturnValue({})
      loggedInUserAreas.mockReturnValue([{ areaId: '5' }])
      await requireProjectAreaSet(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.NAME)
    })
  })

  describe('requireProjectTypeSet', () => {
    test('should continue when type set', async () => {
      getSessionData.mockReturnValue({ projectType: 'new' })
      const result = await requireProjectTypeSet(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect when type not set', async () => {
      getSessionData.mockReturnValue({})
      await requireProjectTypeSet(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.TYPE)
    })
  })

  describe('requireInterventionTypesSet', () => {
    test('should continue when interventionTypes set', async () => {
      getSessionData.mockReturnValue({
        projectType: 'new',
        interventionTypes: ['flood']
      })
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      const result = await requireInterventionTypesSet(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect when required but not set', async () => {
      getSessionData.mockReturnValue({
        projectType: 'new',
        interventionTypes: []
      })
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      await requireInterventionTypesSet(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.INTERVENTION_TYPE
      )
    })
  })

  describe('requirePrimaryInterventionTypeSet', () => {
    test('should continue when primaryInterventionType set', async () => {
      getSessionData.mockReturnValue({
        projectType: 'new',
        projectInterventionTypes: 'flood'
      })
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      const result = await requirePrimaryInterventionTypeSet(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect when required but not set', async () => {
      getSessionData.mockReturnValue({ projectType: 'new' })
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      await requirePrimaryInterventionTypeSet(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE
      )
    })
  })

  describe('requireFinancialStartYearSet', () => {
    test('should continue when financialStartYear set', async () => {
      getSessionData.mockReturnValue({ financialStartYear: 2024 })
      const result = await requireFinancialStartYearSet(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect when not set', async () => {
      getSessionData.mockReturnValue({})
      await requireFinancialStartYearSet(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_START_YEAR
      )
    })
  })

  describe('canViewProposal', () => {
    test('should allow admin to view', () => {
      getAuthSession.mockReturnValue({ user: { id: '1', isAdmin: true } })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(true)
    })

    test('should allow RMA with matching area', () => {
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true, areas: [{ areaId: '5' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(true)
    })

    test('should deny RMA without matching area', () => {
      getAuthSession.mockReturnValue({
        user: { id: '3', isRma: true, areas: [{ areaId: '6' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny RMA with empty areas', () => {
      getAuthSession.mockReturnValue({
        user: { id: '3', isRma: true, areas: [] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny RMA with no areas property', () => {
      getAuthSession.mockReturnValue({
        user: { id: '3', isRma: true }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should allow PSO with access to parent PSO area', () => {
      const mockParentAreas = [
        { id: '2', type: 'PSO' },
        { id: '3', type: 'PSO' }
      ]
      mockRequest.server.app.areasByType = { PSO: [] }
      getParentAreas.mockReturnValue(mockParentAreas)
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '2' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(true)
    })

    test('should deny PSO without access to parent PSO area', () => {
      const mockParentAreas = [{ id: '2', type: 'PSO' }]
      mockRequest.server.app.areasByType = { PSO: [] }
      getParentAreas.mockReturnValue(mockParentAreas)
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '3' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny PSO when areasByType is null', () => {
      mockRequest.server.app.areasByType = null
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '2' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny PSO when no parent areas found', () => {
      mockRequest.server.app.areasByType = { PSO: [] }
      getParentAreas.mockReturnValue([])
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '2' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should allow EA with access to grandparent EA area', () => {
      const mockParentAreas = [
        { id: '1', type: 'EA' },
        { id: '2', type: 'EA' }
      ]
      mockRequest.server.app.areasByType = { EA: [] }
      getParentAreas.mockReturnValue(mockParentAreas)
      getAuthSession.mockReturnValue({
        user: { id: '5', isEa: true, areas: [{ areaId: '1' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(true)
    })

    test('should deny EA without access to grandparent EA area', () => {
      const mockParentAreas = [{ id: '1', type: 'EA' }]
      mockRequest.server.app.areasByType = { EA: [] }
      getParentAreas.mockReturnValue(mockParentAreas)
      getAuthSession.mockReturnValue({
        user: { id: '5', isEa: true, areas: [{ areaId: '2' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny EA when areasByType is null', () => {
      mockRequest.server.app.areasByType = null
      getAuthSession.mockReturnValue({
        user: { id: '5', isEa: true, areas: [{ areaId: '1' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny EA when no parent areas found', () => {
      mockRequest.server.app.areasByType = { EA: [] }
      getParentAreas.mockReturnValue([])
      getAuthSession.mockReturnValue({
        user: { id: '5', isEa: true, areas: [{ areaId: '1' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny when user null', () => {
      getAuthSession.mockReturnValue({ user: null })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny when session null', () => {
      getAuthSession.mockReturnValue(null)
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })

    test('should deny when proposal null', () => {
      getAuthSession.mockReturnValue({ user: { id: '1', isAdmin: true } })
      const result = canViewProposal(mockRequest, null)
      expect(result).toBe(false)
    })

    test('should deny when no role flags set', () => {
      getAuthSession.mockReturnValue({
        user: { id: '6', areas: [{ areaId: '5' }] }
      })
      const result = canViewProposal(mockRequest, { areaId: '5' })
      expect(result).toBe(false)
    })
  })

  describe('canEditProposal', () => {
    test('should deny non-DRAFT', () => {
      getAuthSession.mockReturnValue({ user: { id: '1', isAdmin: true } })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED
      })
      expect(result).toBe(false)
    })

    test('should allow admin for DRAFT', () => {
      getAuthSession.mockReturnValue({ user: { id: '1', isAdmin: true } })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(true)
    })

    test('should allow RMA with matching area for DRAFT', () => {
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true, areas: [{ areaId: '5' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(true)
    })

    test('should deny RMA without matching area for DRAFT', () => {
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true, areas: [{ areaId: '6' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny RMA with empty areas for DRAFT', () => {
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true, areas: [] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should allow PSO with access to parent PSO area for DRAFT', () => {
      const mockParentAreas = [{ id: '2', type: 'PSO' }]
      mockRequest.server.app.areasByType = { PSO: [] }
      getParentAreas.mockReturnValue(mockParentAreas)
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '2' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(true)
    })

    test('should deny PSO without access to parent PSO area for DRAFT', () => {
      const mockParentAreas = [{ id: '2', type: 'PSO' }]
      mockRequest.server.app.areasByType = { PSO: [] }
      getParentAreas.mockReturnValue(mockParentAreas)
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '3' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny PSO when areasByType is null for DRAFT', () => {
      mockRequest.server.app.areasByType = null
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '2' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny PSO when no parent areas found for DRAFT', () => {
      mockRequest.server.app.areasByType = { PSO: [] }
      getParentAreas.mockReturnValue([])
      getAuthSession.mockReturnValue({
        user: { id: '4', isPso: true, areas: [{ areaId: '2' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny EA users', () => {
      getAuthSession.mockReturnValue({
        user: { id: '4', isEa: true, areas: [{ areaId: '1' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny EA users even with access to grandparent area', () => {
      const mockParentAreas = [{ id: '1', type: 'EA' }]
      mockRequest.server.app.areasByType = { EA: [] }
      getParentAreas.mockReturnValue(mockParentAreas)
      getAuthSession.mockReturnValue({
        user: { id: '4', isEa: true, areas: [{ areaId: '1' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny when user null', () => {
      getAuthSession.mockReturnValue({ user: null })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny when session null', () => {
      getAuthSession.mockReturnValue(null)
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })

    test('should deny when proposal null', () => {
      getAuthSession.mockReturnValue({ user: { id: '1', isAdmin: true } })
      const result = canEditProposal(mockRequest, null)
      expect(result).toBe(false)
    })

    test('should deny when no role flags set', () => {
      getAuthSession.mockReturnValue({
        user: { id: '6', areas: [{ areaId: '5' }] }
      })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
      })
      expect(result).toBe(false)
    })
  })

  describe('requireViewPermission', () => {
    test('should continue when has permission', async () => {
      getAuthSession.mockReturnValue({ user: { id: '1', isAdmin: true } })
      mockRequest.pre = { projectData: { id: '1', areaId: '5' } }
      const result = await requireViewPermission(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect when no projectData', async () => {
      getAuthSession.mockReturnValue({ user: { id: '1' } })
      mockRequest.pre = {}
      await requireViewPermission(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('should redirect when no pre object', async () => {
      getAuthSession.mockReturnValue({ user: { id: '1' } })
      mockRequest.pre = null
      await requireViewPermission(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('should redirect when lacks permission', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true, areas: [{ areaId: '6' }] }
      })
      mockRequest.pre = { projectData: { id: '1', areaId: '5' } }
      await requireViewPermission(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('should log warning when no projectData', async () => {
      const loggerWarnSpy = vi.fn()
      mockRequest.server.logger = { warn: loggerWarnSpy }
      getAuthSession.mockReturnValue({ user: { id: '1' } })
      mockRequest.pre = {}
      await requireViewPermission(mockRequest, mockH)
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        { userId: '1' },
        'Project data not found for view permission check'
      )
    })

    test('should log warning when lacks permission', async () => {
      const loggerWarnSpy = vi.fn()
      mockRequest.server.logger = { warn: loggerWarnSpy }
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true, areas: [{ areaId: '6' }] }
      })
      mockRequest.pre = { projectData: { id: '1', areaId: '5' } }
      await requireViewPermission(mockRequest, mockH)
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        { userId: '2', projectId: '1' },
        'User does not have permission to view this project'
      )
    })
  })

  describe('requireEditPermission', () => {
    test('should continue when has permission', async () => {
      getAuthSession.mockReturnValue({ user: { id: '1', isAdmin: true } })
      mockRequest.pre = {
        projectData: {
          id: '1',
          [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
        }
      }
      const result = await requireEditPermission(mockRequest, mockH)
      expect(result).toBe(mockH.continue)
    })

    test('should redirect when no projectData', async () => {
      getAuthSession.mockReturnValue({ user: { id: '1' } })
      mockRequest.pre = {}
      await requireEditPermission(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('should redirect when no pre object', async () => {
      getAuthSession.mockReturnValue({ user: { id: '1' } })
      mockRequest.pre = null
      await requireEditPermission(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('should redirect when lacks permission', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '4', isEa: true, areas: [{ areaId: '1' }] }
      })
      mockRequest.pre = {
        projectData: {
          id: '1',
          [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
        }
      }
      await requireEditPermission(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('should redirect when project not DRAFT', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '2', isRma: true, areas: [{ areaId: '5' }] }
      })
      mockRequest.pre = {
        projectData: {
          id: '1',
          [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED
        }
      }
      await requireEditPermission(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('should log warning when no projectData', async () => {
      const loggerWarnSpy = vi.fn()
      mockRequest.server.logger = { warn: loggerWarnSpy }
      getAuthSession.mockReturnValue({ user: { id: '1' } })
      mockRequest.pre = {}
      await requireEditPermission(mockRequest, mockH)
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        { userId: '1' },
        'Project data not found for edit permission check'
      )
    })

    test('should log warning when lacks permission', async () => {
      const loggerWarnSpy = vi.fn()
      mockRequest.server.logger = { warn: loggerWarnSpy }
      getAuthSession.mockReturnValue({
        user: { id: '4', isEa: true, areas: [{ areaId: '1' }] }
      })
      mockRequest.pre = {
        projectData: {
          id: '1',
          [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '5',
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
        }
      }
      await requireEditPermission(mockRequest, mockH)
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        { userId: '4', projectId: '1', projectStatus: PROJECT_STATUS.DRAFT },
        'User does not have permission to edit this project'
      )
    })
  })
})
