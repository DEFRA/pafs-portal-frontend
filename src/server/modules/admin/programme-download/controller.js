/**
 * All admin download functionality has been moved to the user journey (/download).
 *
 * When an admin user accesses /download (user journey), the controller detects
 * session.user.admin and performs a system-wide download of all proposals.
 *
 * These redirect controllers exist solely to preserve backwards compatibility
 * for any bookmarked or directly linked /admin/downloads URLs.
 */

export const adminDownloadGetController = {
  handler: (_request, h) => h.redirect('/download').permanent()
}

export const adminDownloadGenerateController = {
  handler: (_request, h) => h.redirect('/download').permanent()
}

export const adminDownloadPollController = {
  handler: (_request, h) => h.redirect('/download').permanent()
}

export const adminDownloadFileController = {
  handler: (_request, h) => h.redirect('/download').permanent()
}
