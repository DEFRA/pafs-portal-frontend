/**
 * Configuration mapping for static pages
 * Maps route paths to their corresponding views and translation keys
 */
export const STATIC_PAGE_CONFIG = {
  '/privacy-notice': {
    view: 'modules/general/static/privacy-notice/index',
    titleKey: 'privacy.pages.privacy_notice.title',
    headingKey: 'privacy.pages.privacy_notice.heading'
  }
}
