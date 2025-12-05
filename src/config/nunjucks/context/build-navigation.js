import { ROUTES } from '../../../server/common/constants/routes.js'
import { translate } from '../../../server/common/helpers/i18n.js'

export function buildNavigation(request) {
  const session =
    request?.yar && typeof request.yar.get === 'function'
      ? request.yar.get('auth')
      : null

  if (!session) {
    return []
  }

  const path = request?.path || ''
  const isAdminPath = path.startsWith('/admin')

  if (isAdminPath) {
    return buildAdminNavigation(path)
  }

  return buildGeneralNavigation(path)
}

function buildGeneralNavigation(path) {
  return [
    {
      text: translate('common.navigation.your_proposals'),
      href: ROUTES.GENERAL.PROPOSALS,
      current: path === ROUTES.GENERAL.PROPOSALS
    },
    {
      text: translate('common.navigation.download_all'),
      href: ROUTES.GENERAL.DOWNLOAD,
      current: path === ROUTES.GENERAL.DOWNLOAD
    },
    {
      text: translate('common.navigation.archive'),
      href: ROUTES.GENERAL.ARCHIVE,
      current: path === ROUTES.GENERAL.ARCHIVE
    }
  ]
}

function buildAdminNavigation(path) {
  return [
    {
      text: translate('common.navigation.users'),
      href: ROUTES.ADMIN.USERS,
      current: path === ROUTES.ADMIN.USERS
    },
    {
      text: translate('common.navigation.projects'),
      href: ROUTES.ADMIN.PROJECTS,
      current: path === ROUTES.ADMIN.PROJECTS
    },
    {
      text: translate('common.navigation.submissions'),
      href: ROUTES.ADMIN.SUBMISSIONS,
      current: path === ROUTES.ADMIN.SUBMISSIONS
    },
    {
      text: translate('common.navigation.organisations'),
      href: ROUTES.ADMIN.ORGANISATIONS,
      current: path === ROUTES.ADMIN.ORGANISATIONS
    },
    {
      text: translate('common.navigation.download_projects'),
      href: ROUTES.ADMIN.DOWNLOAD_PROJECTS,
      current: path === ROUTES.ADMIN.DOWNLOAD_PROJECTS
    },
    {
      text: translate('common.navigation.download_rma'),
      href: ROUTES.ADMIN.DOWNLOAD_RMA,
      current: path === ROUTES.ADMIN.DOWNLOAD_RMA
    }
  ]
}
