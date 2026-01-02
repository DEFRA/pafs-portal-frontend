import { ADMIN_VIEWS } from '../../../../common/constants/common.js'
import { ACCOUNT_STATUS } from '../../../../common/constants/accounts.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { createUsersListController } from '../helpers/users-list-controller.js'

export const activeUsersController = createUsersListController({
  status: ACCOUNT_STATUS.ACTIVE,
  viewTemplate: ADMIN_VIEWS.USERS_ACTIVE,
  baseUrl: ROUTES.ADMIN.USERS_ACTIVE
})
