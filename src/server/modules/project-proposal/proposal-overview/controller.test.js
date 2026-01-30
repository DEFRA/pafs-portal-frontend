import { describe, test, expect, vi, beforeEach } from 'vitest'
import { proposalOverviewController } from './controller.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getProjectProposalOverview } from '../../../common/services/project-proposal/project-proposal-service.js'
import { getAreaNameById } from '../../../common/helpers/areas/areas-helper.js'
import { buildFinancialYearLabel } from '../helpers/financial-year.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/services/project-proposal/project-proposal-service.js')
vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('../helpers/financial-year.js')

describe('Proposal Overview Controller', () => {
  let request
  let h

  beforeEach(() => {
    vi.clearAllMocks()
    request = {
      method: 'get',
      params: { referenceNumber: 'REF123' },
      yar: {
        set: vi.fn(),
        get: vi.fn()
      },
      t: vi.fn((key) => key),
      getAreas: vi
        .fn()
        .mockResolvedValue([{ id: 'area-1', name: 'Test Area' }]),
      server: {
        logger: {
          info: vi.fn()
        }
      }
    }
    h = {
      view: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis()
    }
  })

  describe('GET handler', () => {
    test('should render proposal overview page with correct data', async () => {
      const mockAreasData = [{ id: 'area-1', name: 'Test Area' }]
      request.getAreas.mockResolvedValue(mockAreasData)

      const mockProposalData = {
        data: {
          id: '123',
          referenceNumber: 'REF123',
          projectName: 'Test Project',
          rmaArea: 'area-1',
          projectType: 'DEF',
          interventionTypes: ['Type1'],
          mainInterventionType: 'Type1',
          startYear: 2023,
          endYear: 2024,
          lastUpdated: '2023-01-01'
        }
      }
      getAuthSession.mockReturnValue({ accessToken: 'mock-token' })
      getProjectProposalOverview.mockResolvedValue(mockProposalData)
      getAreaNameById.mockReturnValue('Test Area')
      buildFinancialYearLabel.mockImplementation((year) => `FY ${year}`)

      await proposalOverviewController.handler(request, h)

      expect(getAuthSession).toHaveBeenCalledWith(request)
      expect(getProjectProposalOverview).toHaveBeenCalledWith(
        'REF123',
        'mock-token'
      )
      expect(request.getAreas).toHaveBeenCalled()
      expect(getAreaNameById).toHaveBeenCalledWith(mockAreasData, 'area-1')
      expect(getProjectProposalOverview).toHaveBeenCalledWith(
        'REF123',
        'mock-token'
      )
      expect(buildFinancialYearLabel).toHaveBeenCalledWith(2023)
      expect(buildFinancialYearLabel).toHaveBeenCalledWith(2024)

      expect(request.yar.set).toHaveBeenCalledWith('projectProposal', {
        referenceNumber: 'REF123',
        editModeReferenceNumber: 'REF123',
        projectName: 'Test Project',
        rmaSelection: 'Test Area',
        projectType: 'DEF',
        interventionTypes: ['Type1'],
        primaryInterventionType: 'Type1',
        firstFinancialYear: 2023,
        financialStartYearLabel: 'FY 2023',
        lastFinancialYear: 2024,
        financialEndYearLabel: 'FY 2024',
        lastUpdated: '2023-01-01'
      })

      expect(h.view).toHaveBeenCalledWith(
        PROPOSAL_VIEWS.PROPOSAL_OVERVIEW,
        expect.objectContaining({
          title: 'project-proposal.proposal_overview.heading'
        })
      )
    })
  })

  describe('POST handler', () => {
    test('should redirect to start proposal page', async () => {
      request.method = 'post'
      await proposalOverviewController.handler(request, h)
      expect(h.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.START_PROPOSAL
      )
    })
  })
})
