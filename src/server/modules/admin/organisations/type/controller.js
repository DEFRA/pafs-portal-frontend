import { ADMIN_VIEWS } from '../../../../common/constants/common.js'
import {
  AREA_ERROR_CODES,
  ORGANISATION_SESSION_KEYS,
  ORGANISATION_TYPE_OPTIONS
} from '../../../../common/constants/organisations.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { extractJoiErrors } from '../../../../common/helpers/error-renderer/index.js'
import { areaTypeSelectionSchema } from '../schema.js'

class OrganisationTypeController {
  /**
   * Build common view data for organisation forms
   */
  buildViewData(request, options = {}) {
    const sessionData =
      request.yar.get(ORGANISATION_SESSION_KEYS.ORGANISATION_DATA) || {}

    const { fieldErrors = {}, errorCode = '' } = options

    const viewData = {
      pageTitle: request.t('organisations.manage.select_type.title'),
      heading: request.t('organisations.manage.select_type.heading'),
      backLink: ROUTES.ADMIN.ORGANISATIONS,
      fieldErrors,
      errorCode,
      organisationTypeItems: [
        {
          value: '',
          text: request.t('organisations.manage.select_type.select_option')
        },
        ...ORGANISATION_TYPE_OPTIONS
      ],
      formData: sessionData,
      ERROR_CODES: AREA_ERROR_CODES
    }

    return viewData
  }

  /**
   * GET /admin/organisations/new - Select organisation type
   */
  async get(request, h) {
    return h.view(
      ADMIN_VIEWS.ORGANISATION_TYPE,
      this.buildViewData(request, {})
    )
  }

  /**
   * POST /admin/organisations/new - Process type selection
   */
  async post(request, h) {
    const payload = request.payload
    const { error } = areaTypeSelectionSchema.validate(payload, {
      abortEarly: false
    })

    request.yar.set(ORGANISATION_SESSION_KEYS.ORGANISATION_DATA, {
      areaType: payload.areaType
    })
    if (error) {
      return h.view(
        ADMIN_VIEWS.ORGANISATION_TYPE,
        this.buildViewData(request, {
          fieldErrors: extractJoiErrors(error)
        })
      )
    }

    const organisationType = payload.areaType
    // Redirect to type-specific form
    const typeRoute = organisationType.toLowerCase().replace(' area', '')
    return h.redirect(`${ROUTES.ADMIN.ORGANISATIONS}/${typeRoute}`)
  }
}

const controller = new OrganisationTypeController()

export const organisationTypeController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
