class CookiesController {
  get(request, h) {
    return h.view('general/static/cookies/index', {
      pageTitle: request.t('cookies.pages.cookies.title'),
      heading: request.t('cookies.pages.cookies.heading')
    })
  }
}

const controller = new CookiesController()

export const cookiesController = {
  handler: (request, h) => controller.get(request, h)
}
