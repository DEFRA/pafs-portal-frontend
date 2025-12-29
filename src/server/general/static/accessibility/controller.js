class AccessibilityController {
  get(request, h) {
    return h.view('general/static/accessibility/index', {
      pageTitle: request.t('accessibility.pages.accessibility.title'),
      heading: request.t('accessibility.pages.accessibility.heading')
    })
  }
}

const controller = new AccessibilityController()

export const accessibilityController = {
  handler: (request, h) => controller.get(request, h)
}
