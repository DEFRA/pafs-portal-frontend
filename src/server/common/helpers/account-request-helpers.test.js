import { prepareAccountRequestPayload } from './account-request-helpers.js'

describe('#account-request-helpers', () => {
  describe('prepareAccountRequestPayload', () => {
    test('Should prepare payload for EA responsibility', () => {
      const sessionData = {
        details: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'EA'
        },
        eaMainArea: {
          mainEaArea: '10'
        },
        eaAdditionalAreas: {
          additionalEaAreas: ['11', '12']
        }
      }

      const payload = prepareAccountRequestPayload(sessionData)

      expect(payload.user).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
        telephoneNumber: '1234567890',
        organisation: 'Test Org',
        jobTitle: 'Developer',
        responsibility: 'EA'
      })

      expect(payload.areas).toHaveLength(3)
      expect(payload.areas[0]).toEqual({ area_id: 10, primary: true })
      expect(payload.areas[1]).toEqual({ area_id: 11, primary: false })
      expect(payload.areas[2]).toEqual({ area_id: 12, primary: false })
    })

    test('Should prepare payload for PSO responsibility', () => {
      const sessionData = {
        details: {
          firstName: 'Jane',
          lastName: 'Smith',
          emailAddress: 'jane@example.com',
          telephoneNumber: '0987654321',
          organisation: 'Test Org',
          jobTitle: 'Manager',
          responsibility: 'PSO'
        },
        eaArea: {
          eaAreas: ['1', '2']
        },
        mainPsoTeam: {
          mainPsoTeam: '20'
        },
        additionalPsoTeams: {
          additionalPsoTeams: ['21', '22']
        }
      }

      const payload = prepareAccountRequestPayload(sessionData)

      expect(payload.user.responsibility).toBe('PSO')
      expect(payload.areas).toHaveLength(5)
      expect(payload.areas[0]).toEqual({ area_id: 1, primary: false })
      expect(payload.areas[1]).toEqual({ area_id: 2, primary: false })
      expect(payload.areas[2]).toEqual({ area_id: 20, primary: true })
      expect(payload.areas[3]).toEqual({ area_id: 21, primary: false })
      expect(payload.areas[4]).toEqual({ area_id: 22, primary: false })
    })

    test('Should prepare payload for RMA responsibility', () => {
      const sessionData = {
        details: {
          firstName: 'Bob',
          lastName: 'Johnson',
          emailAddress: 'bob@example.com',
          telephoneNumber: '1122334455',
          organisation: 'Test Org',
          jobTitle: 'Director',
          responsibility: 'RMA'
        },
        eaArea: {
          eaAreas: ['1']
        },
        psoTeam: {
          psoTeams: ['10', '11']
        },
        mainRma: {
          mainRma: '30'
        },
        additionalRmas: {
          additionalRmas: ['31', '32']
        }
      }

      const payload = prepareAccountRequestPayload(sessionData)

      expect(payload.user.responsibility).toBe('RMA')
      expect(payload.areas).toHaveLength(6)
      expect(payload.areas[0]).toEqual({ area_id: 1, primary: false })
      expect(payload.areas[1]).toEqual({ area_id: 10, primary: false })
      expect(payload.areas[2]).toEqual({ area_id: 11, primary: false })
      expect(payload.areas[3]).toEqual({ area_id: 30, primary: true })
      expect(payload.areas[4]).toEqual({ area_id: 31, primary: false })
      expect(payload.areas[5]).toEqual({ area_id: 32, primary: false })
    })

    test('Should handle empty session data', () => {
      const sessionData = {}

      const payload = prepareAccountRequestPayload(sessionData)

      expect(payload.user).toEqual({
        firstName: '',
        lastName: '',
        emailAddress: '',
        telephoneNumber: '',
        organisation: '',
        jobTitle: '',
        responsibility: ''
      })
      expect(payload.areas).toEqual([])
    })

    test('Should handle missing area selections', () => {
      const sessionData = {
        details: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'EA'
        }
      }

      const payload = prepareAccountRequestPayload(sessionData)

      expect(payload.user.responsibility).toBe('EA')
      expect(payload.areas).toEqual([])
    })

    test('Should handle numeric area IDs', () => {
      const sessionData = {
        details: {
          responsibility: 'EA'
        },
        eaMainArea: {
          mainEaArea: 10
        },
        eaAdditionalAreas: {
          additionalEaAreas: [11, 12]
        }
      }

      const payload = prepareAccountRequestPayload(sessionData)

      expect(payload.areas[0]).toEqual({ area_id: 10, primary: true })
      expect(payload.areas[1]).toEqual({ area_id: 11, primary: false })
      expect(payload.areas[2]).toEqual({ area_id: 12, primary: false })
    })

    test('Should handle empty additional areas arrays', () => {
      const sessionData = {
        details: {
          responsibility: 'EA'
        },
        eaMainArea: {
          mainEaArea: '10'
        },
        eaAdditionalAreas: {
          additionalEaAreas: []
        }
      }

      const payload = prepareAccountRequestPayload(sessionData)

      expect(payload.areas).toHaveLength(1)
      expect(payload.areas[0]).toEqual({ area_id: 10, primary: true })
    })
  })
})
