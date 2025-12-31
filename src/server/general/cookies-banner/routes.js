import { cookiesBannerController } from './controller.js'

const routes = [
  {
    method: 'POST',
    path: '/cookies/accept',
    ...cookiesBannerController,
    handler: cookiesBannerController.handler.ACCEPT
  },
  {
    method: 'POST',
    path: '/cookies/reject',
    ...cookiesBannerController,
    handler: cookiesBannerController.handler.REJECT
  }
]

export { routes as cookiesBannerRoutes }
