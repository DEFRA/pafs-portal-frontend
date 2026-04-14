import { describe, test, expect, beforeEach, vi } from 'vitest'
import { getCarbonImpactOverviewData } from './carbon-impact.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { getCarbonImpactCalc } from '../../../../common/services/project/project-service.js'
import { updateSessionData } from '../project-utils.js'

vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/services/project/project-service.js')
vi.mock('../project-utils.js')

const mockCalcData = {
  capitalCarbonBaseline: 200,
  capitalCarbonTarget: 180,
  operationalCarbonBaseline: 50,
  operationalCarbonTarget: 45,
  netCarbonEstimate: 250,
  netCarbonWithBlanks: 230,
  constructionTotalFunding: 500000,
  hasValuesChanged: false,
  hexdigest: 'abc123def456',
  carbonCostBuild: '100.0',
  carbonCostOperation: '20.0',
  carbonCostSequestered: '5.0',
  carbonCostAvoided: '3.0'
}

describe('getCarbonImpactOverviewData', () => {
  let mockRequest
  let baseProjectData

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      server: { logger: { error: vi.fn() } }
    }

    getAuthSession.mockReturnValue({ accessToken: 'test-token' })
    getCarbonImpactCalc.mockResolvedValue({ success: false })
    updateSessionData.mockImplementation(() => {})

    baseProjectData = {
      [PROJECT_PAYLOAD_FIELDS.SLUG]: 'ABC-001',
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: null,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: null,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: null,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: null,
      [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: null,
      [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: null
    }
  })

  test('returns success without calling API when all carbon fields are null', async () => {
    const result = await getCarbonImpactOverviewData(
      mockRequest,
      baseProjectData
    )

    expect(getCarbonImpactCalc).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, projectData: baseProjectData })
  })

  test('calls getCarbonImpactCalc when carbon_cost_build is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0'
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledWith('ABC-001', 'test-token')
  })

  test('calls getCarbonImpactCalc when carbon_cost_operation is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '30.0'
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledTimes(1)
  })

  test('calls getCarbonImpactCalc when carbon_cost_sequestered is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '5.0'
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledTimes(1)
  })

  test('calls getCarbonImpactCalc when carbon_cost_avoided is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '2.5'
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledTimes(1)
  })

  test('calls getCarbonImpactCalc when carbon_savings_net_economic_benefit is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '200000'
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledTimes(1)
  })

  test('calls getCarbonImpactCalc when carbon_operational_cost_forecast is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '150000'
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledTimes(1)
  })

  test('returns enriched projectData with carbonCalc on API success', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0'
    }

    getCarbonImpactCalc.mockResolvedValue({ success: true, data: mockCalcData })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.success).toBe(true)
    expect(result.projectData.carbonCalc).toMatchObject({
      capitalCarbonBaseline: 200,
      capitalCarbonTarget: 180,
      operationalCarbonBaseline: 50,
      operationalCarbonTarget: 45,
      netCarbonEstimate: 250,
      netCarbonWithBlanks: 230,
      constructionTotalFunding: 500000,
      hexdigest: 'abc123def456',
      hasValuesChanged: false,
      allCarbonValuesPresent: true
    })
  })

  test('calls updateSessionData with enriched data on API success', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0'
    }

    getCarbonImpactCalc.mockResolvedValue({ success: true, data: mockCalcData })

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(updateSessionData).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ carbonCalc: expect.any(Object) })
    )
  })

  test('sets allCarbonValuesPresent to false when carbonCostOperation is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0'
    }

    getCarbonImpactCalc.mockResolvedValue({
      success: true,
      data: { ...mockCalcData, carbonCostOperation: null }
    })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.allCarbonValuesPresent).toBe(false)
  })

  test('sets allCarbonValuesPresent to false when carbonCostSequestered is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0'
    }

    getCarbonImpactCalc.mockResolvedValue({
      success: true,
      data: { ...mockCalcData, carbonCostSequestered: null }
    })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.allCarbonValuesPresent).toBe(false)
  })

  test('sets allCarbonValuesPresent to false when carbonCostAvoided is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0'
    }

    getCarbonImpactCalc.mockResolvedValue({
      success: true,
      data: { ...mockCalcData, carbonCostAvoided: null }
    })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.allCarbonValuesPresent).toBe(false)
  })

  test('sets hasValuesChanged to true when API reports drift', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '50.0'
    }

    getCarbonImpactCalc.mockResolvedValue({
      success: true,
      data: { ...mockCalcData, hasValuesChanged: true }
    })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.hasValuesChanged).toBe(true)
  })

  test('returns unchanged projectData when API returns success=false', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '50.0'
    }

    getCarbonImpactCalc.mockResolvedValue({ success: false })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result).toEqual({ success: true, projectData })
    expect(updateSessionData).not.toHaveBeenCalled()
  })

  test('returns unchanged projectData when API returns success=true but data is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '5.0'
    }

    getCarbonImpactCalc.mockResolvedValue({ success: true, data: null })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result).toEqual({ success: true, projectData })
    expect(updateSessionData).not.toHaveBeenCalled()
  })

  test('returns success and original projectData when API throws an error', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '3.0'
    }

    getCarbonImpactCalc.mockRejectedValue(new Error('Network timeout'))

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result).toEqual({ success: true, projectData })
  })

  test('logs error when API throws', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0'
    }

    getCarbonImpactCalc.mockRejectedValue(new Error('Connection refused'))

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(mockRequest.server.logger.error).toHaveBeenCalled()
  })

  test('uses empty string for accessToken when authSession is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '10.0'
    }

    getAuthSession.mockReturnValue(null)
    getCarbonImpactCalc.mockResolvedValue({ success: false })

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledWith('ABC-001', '')
  })

  test('uses empty string for accessToken when authSession has no accessToken property', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '200000'
    }

    getAuthSession.mockReturnValue({})
    getCarbonImpactCalc.mockResolvedValue({ success: false })

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(getCarbonImpactCalc).toHaveBeenCalledWith('ABC-001', '')
  })

  test('does not call updateSessionData when API returns no data', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '99000'
    }

    getCarbonImpactCalc.mockResolvedValue({ success: false })

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(updateSessionData).not.toHaveBeenCalled()
  })

  test('returns projectData with carbonCalc that includes original projectData fields', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '10.0',
      someOtherField: 'keep-me'
    }

    getCarbonImpactCalc.mockResolvedValue({ success: true, data: mockCalcData })

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.someOtherField).toBe('keep-me')
  })
})
