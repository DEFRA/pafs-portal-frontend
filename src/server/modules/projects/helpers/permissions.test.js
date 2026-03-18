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
  requireNfmOrSudIntervention,
  canViewProposal,
  canEditProposal,
  requireViewPermission,
  requireEditPermission,
  requireEditableStatus,
  requireStatusManagePermission,
  createConditionalPreHandler
} from './permissions.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  getSessionData,
  loggedInUserAreas,
  navigateToProjectOverview,
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
vi.mock('./project-utils.js', () => ({
  getSessionData: vi.fn(),
  loggedInUserAreas: vi.fn(),
  navigateToProjectOverview: vi.fn(() => Symbol('overview-redirect')),
  requiredInterventionTypesForProjectType: vi.fn()
}))
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
    test('should return auth redirect when authentication does not continue', async () => {
      const authRedirect = Symbol('auth-redirect')
      requireAuth.mockResolvedValue(authRedirect)

      const result = await requireRmaUser(mockRequest, mockH)

      expect(result).toBe(authRedirect)
      expect(getAuthSession).not.toHaveBeenCalled()
    })

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

  describe('requireNfmOrSudIntervention', () => {
    test('should continue when intervention types include NFM', async () => {
      getSessionData.mockReturnValue({
        projectInterventionTypes: ['NFM'],
        slug: 'PAFS-123'
      })

      const result = await requireNfmOrSudIntervention(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should continue when intervention types include SUDS', async () => {
      getSessionData.mockReturnValue({
        projectInterventionTypes: ['SUDS'],
        slug: 'PAFS-124'
      })

      const result = await requireNfmOrSudIntervention(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should redirect to project overview when no NFM/SUDS intervention', async () => {
      getAuthSession.mockReturnValue({ user: { id: '9' } })
      getSessionData.mockReturnValue({
        projectInterventionTypes: ['PFR'],
        slug: 'PAFS-125'
      })

      await requireNfmOrSudIntervention(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/project/PAFS-125')
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect when intervention types is not an array', async () => {
      getAuthSession.mockReturnValue({ user: { id: '10' } })
      getSessionData.mockReturnValue({
        projectInterventionTypes: 'NFM',
        slug: 'PAFS-126'
      })

      await requireNfmOrSudIntervention(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/project/PAFS-126')
      expect(mockH.takeover).toHaveBeenCalled()
    })
  })

  describe('canViewProposal', () => {
    test('should allow admin to view', () => {
      getAuthSession.mockReturnValue({ user: { id: '1', admin: true } })
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
      getAuthSession.mockReturnValue({ user: { id: '1', admin: true } })
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
      getAuthSession.mockReturnValue({ user: { id: '1', admin: true } })
      const result = canEditProposal(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED
      })
      expect(result).toBe(false)
    })

    test('should allow admin for DRAFT', () => {
      getAuthSession.mockReturnValue({ user: { id: '1', admin: true } })
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
      getAuthSession.mockReturnValue({ user: { id: '1', admin: true } })
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
      getAuthSession.mockReturnValue({ user: { id: '1', admin: true } })
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
      getAuthSession.mockReturnValue({ user: { id: '1', admin: true } })
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

  describe('createConditionalPreHandler', () => {
    test('should continue when field value matches expected value', async () => {
      const preHandler = createConditionalPreHandler(
        'environmentalBenefits',
        true,
        ROUTES.PROJECT.OVERVIEW
      )

      mockRequest.pre = { projectData: { id: '1' } }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        environmentalBenefits: true
      })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      const result = await preHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should redirect when field value does not match expected value', async () => {
      const preHandler = createConditionalPreHandler(
        'environmentalBenefits',
        true,
        ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS
      )

      mockRequest.pre = { projectData: { id: '1' } }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        environmentalBenefits: false
      })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await preHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to overview when projectData not found', async () => {
      const preHandler = createConditionalPreHandler(
        'environmentalBenefits',
        true,
        ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS
      )

      mockRequest.pre = {}
      getSessionData.mockReturnValue({ slug: 'TEST-001' })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      const result = await preHandler(mockRequest, mockH)

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBeDefined()
    })

    test('should check field value from sessionData not projectData', async () => {
      const preHandler = createConditionalPreHandler(
        'woodland',
        true,
        ROUTES.PROJECT.EDIT.WOODLAND
      )

      mockRequest.pre = { projectData: { woodland: false } }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        woodland: true
      })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      const result = await preHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should log warning when projectData not found', async () => {
      const loggerWarnSpy = vi.fn()
      mockRequest.server.logger = { warn: loggerWarnSpy }

      const preHandler = createConditionalPreHandler(
        'environmentalBenefits',
        true,
        ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS
      )

      mockRequest.pre = {}
      getSessionData.mockReturnValue({ slug: 'TEST-001' })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await preHandler(mockRequest, mockH)

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        { userId: '1' },
        'Project data not found for conditional pre-handler check'
      )
    })

    test('should log warning when field value does not match', async () => {
      const loggerWarnSpy = vi.fn()
      mockRequest.server.logger = { warn: loggerWarnSpy }

      const preHandler = createConditionalPreHandler(
        'intertidal_habitat',
        true,
        ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT,
        'Custom log message'
      )

      mockRequest.pre = { projectData: { id: '1' } }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        intertidal_habitat: false
      })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await preHandler(mockRequest, mockH)

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        {
          userId: '1',
          projectId: '1',
          fieldName: 'intertidal_habitat',
          expectedValue: true,
          actualValue: false
        },
        'Custom log message'
      )
    })

    test('should use default log message when custom message not provided', async () => {
      const loggerWarnSpy = vi.fn()
      mockRequest.server.logger = { warn: loggerWarnSpy }

      const preHandler = createConditionalPreHandler(
        'woodland',
        true,
        ROUTES.PROJECT.EDIT.WOODLAND
      )

      mockRequest.pre = { projectData: { id: '1' } }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        woodland: false
      })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await preHandler(mockRequest, mockH)

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        {
          userId: '1',
          projectId: '1',
          fieldName: 'woodland',
          expectedValue: true,
          actualValue: false
        },
        'User attempted to access route requiring woodland=true, but value is false'
      )
    })

    test('should handle null field values', async () => {
      const preHandler = createConditionalPreHandler(
        'grassland',
        true,
        ROUTES.PROJECT.EDIT.GRASSLAND
      )

      mockRequest.pre = { projectData: { id: '1' } }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        grassland: null
      })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await preHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should handle undefined field values', async () => {
      const preHandler = createConditionalPreHandler(
        'heathland',
        true,
        ROUTES.PROJECT.EDIT.HEATHLAND
      )

      mockRequest.pre = { projectData: { id: '1' } }
      getSessionData.mockReturnValue({
        slug: 'TEST-001'
      })
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await preHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
      expect(mockH.takeover).toHaveBeenCalled()
    })
  })

  describe('requireEditableStatus', () => {
    test('should continue when project is draft', async () => {
      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT
        }
      }
      mockRequest.params = { referenceNumber: 'REF123' }
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      const result = await requireEditableStatus(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should continue when project is revise', async () => {
      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.REVISE
        }
      }
      mockRequest.params = { referenceNumber: 'REF123' }
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      const result = await requireEditableStatus(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should redirect to overview when project is archived', async () => {
      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
          [PROJECT_PAYLOAD_FIELDS.SLUG]: 'REF123'
        }
      }
      mockRequest.params = { referenceNumber: 'REF123' }
      mockRequest.server = { logger: { warn: vi.fn() } }
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await requireEditableStatus(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to overview when project is submitted', async () => {
      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
          [PROJECT_PAYLOAD_FIELDS.SLUG]: 'REF123'
        }
      }
      mockRequest.params = { referenceNumber: 'REF123' }
      mockRequest.server = { logger: { warn: vi.fn() } }
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await requireEditableStatus(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should log warning when non-editable project edit attempted', async () => {
      const mockWarn = vi.fn()
      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
          [PROJECT_PAYLOAD_FIELDS.SLUG]: 'REF123'
        }
      }
      mockRequest.params = { referenceNumber: 'REF123' }
      mockRequest.server = { logger: { warn: mockWarn } }
      getAuthSession.mockReturnValue({ user: { id: 'user-1' } })

      await requireEditableStatus(mockRequest, mockH)

      expect(mockWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          referenceNumber: 'REF123',
          projectState: PROJECT_STATUS.ARCHIVED
        }),
        'User attempted to access edit route for non-editable project'
      )
    })

    test('should log warning for submitted project edit attempt', async () => {
      const mockWarn = vi.fn()
      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
          [PROJECT_PAYLOAD_FIELDS.SLUG]: 'REF123'
        }
      }
      mockRequest.params = { referenceNumber: 'REF123' }
      mockRequest.server = { logger: { warn: mockWarn } }
      getAuthSession.mockReturnValue({ user: { id: 'user-1' } })

      await requireEditableStatus(mockRequest, mockH)

      expect(mockWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          referenceNumber: 'REF123',
          projectState: PROJECT_STATUS.SUBMITTED
        }),
        'User attempted to access edit route for non-editable project'
      )
    })

    test('should redirect to home when projectData is missing', async () => {
      mockRequest.pre = {}
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await requireEditableStatus(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should use slug as fallback when referenceNumber not in params', async () => {
      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
          [PROJECT_PAYLOAD_FIELDS.SLUG]: 'SLUG-456'
        }
      }
      mockRequest.params = {}
      mockRequest.server = { logger: { warn: vi.fn() } }
      getAuthSession.mockReturnValue({ user: { id: '1' } })

      await requireEditableStatus(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'SLUG-456')
      )
    })
  })

  describe('requireStatusManagePermission', () => {
    beforeEach(() => {
      mockH = {
        continue: Symbol('continue'),
        redirect: vi.fn().mockReturnThis(),
        takeover: vi.fn().mockReturnThis()
      }
    })

    test('should allow RMA users', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '1', isRma: true }
      })

      const result = await requireStatusManagePermission(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should allow PSO users', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '1', isPso: true }
      })

      const result = await requireStatusManagePermission(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should allow Admin users', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '1', admin: true }
      })

      const result = await requireStatusManagePermission(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('should block EA users and redirect to overview', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '1', isEa: true }
      })
      mockRequest.params = { referenceNumber: 'REF-123' }

      await requireStatusManagePermission(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF-123')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should block users with no roles and redirect to overview', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '1' }
      })
      mockRequest.params = { referenceNumber: 'REF-123' }

      await requireStatusManagePermission(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF-123')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to home when no referenceNumber available', async () => {
      getAuthSession.mockReturnValue({
        user: { id: '1', isEa: true }
      })
      mockRequest.params = {}

      await requireStatusManagePermission(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to home when no session user', async () => {
      getAuthSession.mockReturnValue({})
      mockRequest.params = {}

      await requireStatusManagePermission(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should log warning when user is blocked', async () => {
      getAuthSession.mockReturnValue({
        user: { id: 'ea-user-1', isEa: true }
      })
      mockRequest.params = { referenceNumber: 'REF-123' }
      mockRequest.server = { logger: { warn: vi.fn() } }

      await requireStatusManagePermission(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        {
          userId: 'ea-user-1',
          referenceNumber: 'REF-123'
        },
        'User without status manage permission attempted archive/revert action'
      )
    })
  })
})
