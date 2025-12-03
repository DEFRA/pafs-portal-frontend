import { ADMIN_VIEWS } from '../../../common/constants/common.js'
import { ACCOUNT_STATUS } from '../../../common/constants/accounts.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { createUsersListController } from '../helpers/users-list-controller.js'

export const pendingUsersController = createUsersListController({
  status: ACCOUNT_STATUS.PENDING,
  viewTemplate: ADMIN_VIEWS.USERS_PENDING,
  baseUrl: ROUTES.ADMIN.USERS_PENDING
})
