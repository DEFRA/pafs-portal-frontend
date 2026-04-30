import { describe, test, expect, beforeEach, vi } from 'vitest'
import { getCarbonImpactOverviewData } from './carbon-impact.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { updateSessionData } from '../project-utils.js'

vi.mock('../project-utils.js')

// Shape returned by the backend inside the project overview response
const mockCarbonCalc = {
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

  test('returns success without enriching when all carbon fields are null', async () => {
    const result = await getCarbonImpactOverviewData(
      mockRequest,
      baseProjectData
    )

    expect(updateSessionData).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, projectData: baseProjectData })
  })

  test('returns enriched projectData with carbonCalc when carbonCalc is present in projectData', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0',
      carbonCalc: mockCarbonCalc
    }

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

  test('calls updateSessionData with enriched data when carbonCalc is present', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0',
      carbonCalc: mockCarbonCalc
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(updateSessionData).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ carbonCalc: expect.any(Object) })
    )
  })

  test('sets allCarbonValuesPresent to false when carbonCostOperation is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0',
      carbonCalc: { ...mockCarbonCalc, carbonCostOperation: null }
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.allCarbonValuesPresent).toBe(false)
  })

  test('sets allCarbonValuesPresent to false when carbonCostSequestered is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0',
      carbonCalc: { ...mockCarbonCalc, carbonCostSequestered: null }
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.allCarbonValuesPresent).toBe(false)
  })

  test('sets allCarbonValuesPresent to false when carbonCostAvoided is null', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.0',
      carbonCalc: { ...mockCarbonCalc, carbonCostAvoided: null }
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.allCarbonValuesPresent).toBe(false)
  })

  test('sets hasValuesChanged to true when backend reports drift', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '50.0',
      carbonCalc: { ...mockCarbonCalc, hasValuesChanged: true }
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc.hasValuesChanged).toBe(true)
  })

  test('returns unchanged projectData when carbon fields are present but carbonCalc is absent', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '50.0'
      // no carbonCalc — backend calculation may have failed
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.success).toBe(true)
    expect(result.projectData.carbonDisplay).toBeDefined()
    expect(updateSessionData).not.toHaveBeenCalled()
  })

  test('does not call updateSessionData when carbonCalc is absent', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '99000'
    }

    await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(updateSessionData).not.toHaveBeenCalled()
  })

  test('preserves other projectData fields when enriching with carbonCalc', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '10.0',
      someOtherField: 'keep-me',
      carbonCalc: mockCarbonCalc
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.someOtherField).toBe('keep-me')
  })

  test('enriches when carbon_cost_operation field is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '30.0',
      carbonCalc: mockCarbonCalc
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc).toBeDefined()
  })

  test('enriches when carbon_cost_sequestered field is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '5.0',
      carbonCalc: mockCarbonCalc
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc).toBeDefined()
  })

  test('enriches when carbon_cost_avoided field is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '2.5',
      carbonCalc: mockCarbonCalc
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc).toBeDefined()
  })

  test('enriches when carbon_savings_net_economic_benefit field is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '200000',
      carbonCalc: mockCarbonCalc
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc).toBeDefined()
  })

  test('enriches when carbon_operational_cost_forecast field is populated', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '150000',
      carbonCalc: mockCarbonCalc
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)

    expect(result.projectData.carbonCalc).toBeDefined()
  })

  test('attaches carbonDisplay with formatted tCO2e values when carbonCalc is present', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '1000000.50',
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '500000',
      carbonCalc: mockCarbonCalc
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)
    const { carbonDisplay } = result.projectData

    expect(carbonDisplay).toBeDefined()
    // Session values — BigInt formatted (no float conversion)
    expect(carbonDisplay.buildFormatted).toBe('1,000,000.50')
    expect(carbonDisplay.operationFormatted).toBe('500,000.00')
    // API calc values — thousands commas + 2dp
    expect(carbonDisplay.capitalCarbonBaselineFormatted).toBe('200.00')
    expect(carbonDisplay.netCarbonEstimateFormatted).toBe('250.00')
  })

  test('attaches carbonDisplay with formatted session values when carbonCalc is absent', async () => {
    const projectData = {
      ...baseProjectData,
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '75000.25',
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '25000'
    }

    const result = await getCarbonImpactOverviewData(mockRequest, projectData)
    const { carbonDisplay } = result.projectData

    expect(carbonDisplay).toBeDefined()
    expect(carbonDisplay.buildFormatted).toBe('75,000.25')
    expect(carbonDisplay.operationFormatted).toBe('25,000.00')
    expect(carbonDisplay.wholeLifeCarbonFormatted).toBe('100,000.25')
  })
})
