import { describe, test, expect } from 'vitest'
import { firstFinancialYearManual } from './index.js'

describe('#firstFinancialYearManual plugin', () => {
  test('plugin is defined', () => {
    expect(firstFinancialYearManual).toBeDefined()
    expect(firstFinancialYearManual.plugin.name).toBe(
      'Project Proposal - First Financial Year (Manual Entry)'
    )
  })

  test('register method exists', () => {
    expect(firstFinancialYearManual.plugin.register).toBeTypeOf('function')
  })

  test('routes have correct middleware', () => {
    const mockServer = {
      route: (routes) => {
        const getRoute = routes.find((r) => r.method === 'GET')
        const postRoute = routes.find((r) => r.method === 'POST')

        expect(getRoute).toBeDefined()
        expect(postRoute).toBeDefined()

        // Auth middleware is wrapped in object, guards are direct functions
        expect(getRoute.options.pre).toHaveLength(3)
        expect(postRoute.options.pre).toHaveLength(3)
        expect(getRoute.options.pre[0]).toHaveProperty('method')

        expect(getRoute.path).toBe(
          '/project-proposal/first-financial-year-manual'
        )
        expect(postRoute.path).toBe(
          '/project-proposal/first-financial-year-manual'
        )
      }
    }

    firstFinancialYearManual.plugin.register(mockServer)
  })
})
