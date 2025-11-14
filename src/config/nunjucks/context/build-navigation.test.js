import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        current: false,
        text: 'Your proposals',
        href: '/'
      },
      {
        current: false,
        text: 'Download All',
        href: '/download'
      },
      {
        current: false,
        text: 'Archive',
        href: '/archive'
      }
    ])
  })

  test('Should provide expected highlighted navigation details for Download', () => {
    expect(buildNavigation(mockRequest({ path: '/download' }))).toEqual([
      {
        current: false,
        text: 'Your proposals',
        href: '/'
      },
      {
        current: true,
        text: 'Download All',
        href: '/download'
      },
      {
        current: false,
        text: 'Archive',
        href: '/archive'
      }
    ])
  })

  test('Should provide expected highlighted navigation details for Archive', () => {
    expect(buildNavigation(mockRequest({ path: '/archive' }))).toEqual([
      {
        current: false,
        text: 'Your proposals',
        href: '/'
      },
      {
        current: false,
        text: 'Download All',
        href: '/download'
      },
      {
        current: true,
        text: 'Archive',
        href: '/archive'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        current: true,
        text: 'Your proposals',
        href: '/'
      },
      {
        current: false,
        text: 'Download All',
        href: '/download'
      },
      {
        current: false,
        text: 'Archive',
        href: '/archive'
      }
    ])
  })
})
