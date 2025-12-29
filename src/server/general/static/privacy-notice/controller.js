class PrivacyNoticeController {
  get(request, h) {
    return h.view('general/static/privacy-notice/index', {
      pageTitle: request.t('privacy.pages.privacy_notice.title'),
      heading: request.t('privacy.pages.privacy_notice.heading')
    })
  }
}

const controller = new PrivacyNoticeController()

export const privacyNoticeController = {
  handler: (request, h) => controller.get(request, h)
}
