import { describe, test, expect, vi } from 'vitest'
import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return {
    ...options,
    yar: {
      get: vi.fn(() => options.session || { user: { id: 1 } })
    }
  }
}

describe('#buildNavigation', () => {
  describe('General user navigation', () => {
    test('Should provide expected navigation details', () => {
      expect(
        buildNavigation(mockRequest({ path: '/non-existent-path' }))
      ).toEqual([
        {
          current: false,
          text: 'common.navigation.your_proposals',
          href: '/'
        },
        {
          current: false,
          text: 'common.navigation.download_all',
          href: '/download'
        },
        {
          current: false,
          text: 'common.navigation.archive',
          href: '/archive'
        }
      ])
    })

    test('Should provide expected highlighted navigation details for Download', () => {
      expect(buildNavigation(mockRequest({ path: '/download' }))).toEqual([
        {
          current: false,
          text: 'common.navigation.your_proposals',
          href: '/'
        },
        {
          current: true,
          text: 'common.navigation.download_all',
          href: '/download'
        },
        {
          current: false,
          text: 'common.navigation.archive',
          href: '/archive'
        }
      ])
    })

    test('Should provide expected highlighted navigation details for Archive', () => {
      expect(buildNavigation(mockRequest({ path: '/archive' }))).toEqual([
        {
          current: false,
          text: 'common.navigation.your_proposals',
          href: '/'
        },
        {
          current: false,
          text: 'common.navigation.download_all',
          href: '/download'
        },
        {
          current: true,
          text: 'common.navigation.archive',
          href: '/archive'
        }
      ])
    })

    test('Should provide expected highlighted navigation details for home', () => {
      expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
        {
          current: true,
          text: 'common.navigation.your_proposals',
          href: '/'
        },
        {
          current: false,
          text: 'common.navigation.download_all',
          href: '/download'
        },
        {
          current: false,
          text: 'common.navigation.archive',
          href: '/archive'
        }
      ])
    })
  })

  describe('Admin navigation', () => {
    test('Should provide admin navigation for /admin/users path', () => {
      expect(buildNavigation(mockRequest({ path: '/admin/users' }))).toEqual([
        {
          current: true,
          text: 'common.navigation.users',
          href: '/admin/users/active'
        },
        {
          current: false,
          text: 'common.navigation.projects',
          href: '/admin/projects'
        },
        {
          current: false,
          text: 'common.navigation.submissions',
          href: '/admin/submissions'
        },
        {
          current: false,
          text: 'common.navigation.organisations',
          href: '/admin/organisations'
        },
        {
          current: false,
          text: 'common.navigation.download_projects',
          href: '/admin/download-projects'
        },
        {
          current: false,
          text: 'common.navigation.download_rma',
          href: '/admin/download-rma'
        }
      ])
    })

    test('Should highlight Users for /admin/users/pending path', () => {
      expect(
        buildNavigation(mockRequest({ path: '/admin/users/pending' }))
      ).toEqual([
        {
          current: true,
          text: 'common.navigation.users',
          href: '/admin/users/active'
        },
        {
          current: false,
          text: 'common.navigation.projects',
          href: '/admin/projects'
        },
        {
          current: false,
          text: 'common.navigation.submissions',
          href: '/admin/submissions'
        },
        {
          current: false,
          text: 'common.navigation.organisations',
          href: '/admin/organisations'
        },
        {
          current: false,
          text: 'common.navigation.download_projects',
          href: '/admin/download-projects'
        },
        {
          current: false,
          text: 'common.navigation.download_rma',
          href: '/admin/download-rma'
        }
      ])
    })

    test('Should highlight Users for /admin/users/active path', () => {
      expect(
        buildNavigation(mockRequest({ path: '/admin/users/active' }))
      ).toEqual([
        {
          current: true,
          text: 'common.navigation.users',
          href: '/admin/users/active'
        },
        {
          current: false,
          text: 'common.navigation.projects',
          href: '/admin/projects'
        },
        {
          current: false,
          text: 'common.navigation.submissions',
          href: '/admin/submissions'
        },
        {
          current: false,
          text: 'common.navigation.organisations',
          href: '/admin/organisations'
        },
        {
          current: false,
          text: 'common.navigation.download_projects',
          href: '/admin/download-projects'
        },
        {
          current: false,
          text: 'common.navigation.download_rma',
          href: '/admin/download-rma'
        }
      ])
    })

    test('Should provide admin navigation for /admin/projects path', () => {
      expect(buildNavigation(mockRequest({ path: '/admin/projects' }))).toEqual(
        [
          {
            current: false,
            text: 'common.navigation.users',
            href: '/admin/users/active'
          },
          {
            current: true,
            text: 'common.navigation.projects',
            href: '/admin/projects'
          },
          {
            current: false,
            text: 'common.navigation.submissions',
            href: '/admin/submissions'
          },
          {
            current: false,
            text: 'common.navigation.organisations',
            href: '/admin/organisations'
          },
          {
            current: false,
            text: 'common.navigation.download_projects',
            href: '/admin/download-projects'
          },
          {
            current: false,
            text: 'common.navigation.download_rma',
            href: '/admin/download-rma'
          }
        ]
      )
    })

    test('Should provide admin navigation for /admin/submissions path', () => {
      expect(
        buildNavigation(mockRequest({ path: '/admin/submissions' }))
      ).toEqual([
        {
          current: false,
          text: 'common.navigation.users',
          href: '/admin/users/active'
        },
        {
          current: false,
          text: 'common.navigation.projects',
          href: '/admin/projects'
        },
        {
          current: true,
          text: 'common.navigation.submissions',
          href: '/admin/submissions'
        },
        {
          current: false,
          text: 'common.navigation.organisations',
          href: '/admin/organisations'
        },
        {
          current: false,
          text: 'common.navigation.download_projects',
          href: '/admin/download-projects'
        },
        {
          current: false,
          text: 'common.navigation.download_rma',
          href: '/admin/download-rma'
        }
      ])
    })

    test('Should provide admin navigation for /admin/organisations path', () => {
      expect(
        buildNavigation(mockRequest({ path: '/admin/organisations' }))
      ).toEqual([
        {
          current: false,
          text: 'common.navigation.users',
          href: '/admin/users/active'
        },
        {
          current: false,
          text: 'common.navigation.projects',
          href: '/admin/projects'
        },
        {
          current: false,
          text: 'common.navigation.submissions',
          href: '/admin/submissions'
        },
        {
          current: true,
          text: 'common.navigation.organisations',
          href: '/admin/organisations'
        },
        {
          current: false,
          text: 'common.navigation.download_projects',
          href: '/admin/download-projects'
        },
        {
          current: false,
          text: 'common.navigation.download_rma',
          href: '/admin/download-rma'
        }
      ])
    })

    test('Should provide admin navigation for /admin/download-projects path', () => {
      expect(
        buildNavigation(mockRequest({ path: '/admin/download-projects' }))
      ).toEqual([
        {
          current: false,
          text: 'common.navigation.users',
          href: '/admin/users/active'
        },
        {
          current: false,
          text: 'common.navigation.projects',
          href: '/admin/projects'
        },
        {
          current: false,
          text: 'common.navigation.submissions',
          href: '/admin/submissions'
        },
        {
          current: false,
          text: 'common.navigation.organisations',
          href: '/admin/organisations'
        },
        {
          current: true,
          text: 'common.navigation.download_projects',
          href: '/admin/download-projects'
        },
        {
          current: false,
          text: 'common.navigation.download_rma',
          href: '/admin/download-rma'
        }
      ])
    })

    test('Should provide admin navigation for /admin/download-rma path', () => {
      expect(
        buildNavigation(mockRequest({ path: '/admin/download-rma' }))
      ).toEqual([
        {
          current: false,
          text: 'common.navigation.users',
          href: '/admin/users/active'
        },
        {
          current: false,
          text: 'common.navigation.projects',
          href: '/admin/projects'
        },
        {
          current: false,
          text: 'common.navigation.submissions',
          href: '/admin/submissions'
        },
        {
          current: false,
          text: 'common.navigation.organisations',
          href: '/admin/organisations'
        },
        {
          current: false,
          text: 'common.navigation.download_projects',
          href: '/admin/download-projects'
        },
        {
          current: true,
          text: 'common.navigation.download_rma',
          href: '/admin/download-rma'
        }
      ])
    })
  })

  describe('No session', () => {
    test('Should return empty array when no session exists', () => {
      const request = {
        path: '/',
        yar: {
          get: vi.fn(() => null)
        }
      }

      expect(buildNavigation(request)).toEqual([])
    })

    test('Should return empty array when yar is undefined', () => {
      const request = {
        path: '/'
      }

      expect(buildNavigation(request)).toEqual([])
    })

    test('Should return empty array when request is null', () => {
      expect(buildNavigation(null)).toEqual([])
    })

    test('Should return empty array when request is undefined', () => {
      expect(buildNavigation(undefined)).toEqual([])
    })
  })

  describe('Edge cases', () => {
    test('Should handle missing path gracefully', () => {
      const request = {
        yar: {
          get: vi.fn(() => ({ user: { id: 1 } }))
        }
      }

      expect(buildNavigation(request)).toEqual([
        {
          current: false,
          text: 'common.navigation.your_proposals',
          href: '/'
        },
        {
          current: false,
          text: 'common.navigation.download_all',
          href: '/download'
        },
        {
          current: false,
          text: 'common.navigation.archive',
          href: '/archive'
        }
      ])
    })
  })
})
