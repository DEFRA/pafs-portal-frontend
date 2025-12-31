import { cookiesBannerController } from './controller.js'

const routes = [
  {
    method: 'POST',
    path: '/cookies/accept',
    ...cookiesBannerController,
    handler: cookiesBannerController.handler.accept
  },
  {
    method: 'POST',
    path: '/cookies/reject',
    ...cookiesBannerController,
    handler: cookiesBannerController.handler.reject
  }
]

export { routes as cookiesBannerRoutes }
