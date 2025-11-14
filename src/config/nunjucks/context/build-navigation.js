export function buildNavigation(request) {
  return [
    {
      text: 'Your proposals',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'Download All',
      href: '/download',
      current: request?.path === '/download'
    },
    {
      text: 'Archive',
      href: '/archive',
      current: request?.path === '/archive'
    }
  ]
}
