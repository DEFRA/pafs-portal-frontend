import { describe, test, expect, vi, beforeEach } from 'vitest'
import { proposalOverviewController } from './controller.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getProjectProposalOverview } from '../../../common/services/project-proposal/project-proposal-service.js'
import { convertYearToFinancialYearLabel } from '../common/financial-year-helper.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/services/project-proposal/project-proposal-service.js')
vi.mock('../common/financial-year-helper.js')

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
      const mockSession = { accessToken: 'mock-token' }
      getAuthSession.mockReturnValue(mockSession)

      const mockProposalData = {
        data: {
          id: '123',
          referenceNumber: 'REF123',
          projectName: 'Test Project',
          rmaArea: 'Test Area',
          projectType: 'DEF',
          interventionTypes: ['Type1'],
          mainInterventionType: 'Type1',
          startYear: 2023,
          endYear: 2024,
          lastUpdated: '2023-01-01'
        }
      }
      getProjectProposalOverview.mockResolvedValue(mockProposalData)
      convertYearToFinancialYearLabel.mockImplementation((year) => `FY ${year}`)

      await proposalOverviewController.handler(request, h)

      expect(getAuthSession).toHaveBeenCalledWith(request)
      expect(getProjectProposalOverview).toHaveBeenCalledWith(
        'REF123',
        'mock-token'
      )
      expect(convertYearToFinancialYearLabel).toHaveBeenCalledWith(2023)
      expect(convertYearToFinancialYearLabel).toHaveBeenCalledWith(2024)

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
