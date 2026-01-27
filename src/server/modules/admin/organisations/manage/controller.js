import {
  ADMIN_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { authoritySchema, psoSchema, rmaSchema } from '../schema.js'
import {
  AREA_ERROR_CODES,
  ORGANISATION_SESSION_KEYS
} from '../../../../common/constants/organisations.js'
import { createAreasService } from '../../../../common/services/areas/areas-service.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import {
  extractJoiErrors,
  extractApiValidationErrors,
  extractApiError
} from '../../../../common/helpers/error-renderer/index.js'
import {
  getOrganisationTypeSelectionPath,
  verifyOrganisationType,
  dateToISOString,
  detectChanges
} from '../helpers/organisations.js'
import {
  buildAreaDropdownByType,
  buildRfccCodeDropdown
} from '../../../../common/helpers/areas/areas-helper.js'

const ORG_TYPE_CONFIG = {
  authority: {
    type: AREAS_RESPONSIBILITIES_MAP.AUTHORITY,
    schema: authoritySchema,
    route: AREAS_RESPONSIBILITIES_MAP.AUTHORITY.toLowerCase(),
    fields: ['identifier']
  },
  pso: {
    type: AREAS_RESPONSIBILITIES_MAP.PSO,
    schema: psoSchema,
    route: AREAS_RESPONSIBILITIES_MAP.PSO.replaceAll(' Area', '').toLowerCase(),
    fields: ['parentId', 'subType']
  },
  rma: {
    type: AREAS_RESPONSIBILITIES_MAP.RMA,
    schema: rmaSchema,
    route: AREAS_RESPONSIBILITIES_MAP.RMA.toLowerCase(),
    fields: ['identifier', 'parentId', 'subType']
  }
}

class OrganisationManageController {
  /**
   * Get type configuration by route
   */
  getTypeConfig(orgType) {
    return ORG_TYPE_CONFIG[orgType] || null
  }

  /**
   * Build view data for organisation forms
   */
  async buildViewData(request, typeConfig, options = {}) {
    const dropdownOptions = await this.getDropdownOptions(request)
    const { formData, fieldErrors = {}, errorCode = '', isEditMode } = options
    return {
      pageTitle: this.getPageTitle(request, typeConfig.route, isEditMode),
      heading: this.getHeading(request, typeConfig.route, isEditMode),
      backLink: this.getBackLink(isEditMode),
      step: typeConfig.route,
      isEditMode,
      fieldErrors,
      errorCode,
      formData,
      ERROR_CODES: AREA_ERROR_CODES,
      // Dropdown options
      ...dropdownOptions
    }
  }

  /**
   * Fetch dropdown options for all organisation types
   */
  async getDropdownOptions(request) {
    try {
      const areasData = await request.getAreas()

      return {
        authorityOptions: buildAreaDropdownByType({
          areasData,
          type: AREAS_RESPONSIBILITIES_MAP.AUTHORITY,
          textColumn: 'identifier',
          idColumn: 'identifier',
          emptyText: request.t(
            'organisations.manage.rma.select_authority_option'
          )
        }),
        psoOptions: buildAreaDropdownByType({
          areasData,
          type: AREAS_RESPONSIBILITIES_MAP.PSO,
          emptyText: request.t('organisations.manage.rma.select_pso_option')
        }),
        eaAreaOptions: buildAreaDropdownByType({
          areasData,
          type: AREAS_RESPONSIBILITIES_MAP.EA,
          emptyText: request.t('organisations.manage.pso.select_ea_option')
        }),
        rfccOptions: buildRfccCodeDropdown({
          areasData,
          emptyText: request.t('organisations.manage.pso.select_rfcc_option')
        })
      }
    } catch (error) {
      request.logger?.error('Error fetching dropdown options:', error)
      return {
        authorityOptions: [],
        psoOptions: [],
        eaAreaOptions: [],
        rfccOptions: []
      }
    }
  }

  /**
   * Get translated text for a specific key
   * @private
   */
  _getTranslation(request, orgType, key, isEditMode) {
    const suffix = isEditMode ? 'edit' : 'add'
    return request.t(`organisations.manage.${orgType}.${key}_${suffix}`)
  }

  /**
   * Get translated page title
   */
  getPageTitle(request, orgType, isEditMode) {
    return this._getTranslation(request, orgType, 'title', isEditMode)
  }

  /**
   * Get translated page heading
   */
  getHeading(request, orgType, isEditMode) {
    return this._getTranslation(request, orgType, 'heading', isEditMode)
  }

  /**
   * Get back link URL
   */
  getBackLink(isEditMode) {
    return isEditMode
      ? ROUTES.ADMIN.ORGANISATIONS
      : getOrganisationTypeSelectionPath()
  }

  /**
   * Validate type config and redirect if invalid
   * @private
   */
  _validateTypeConfig(typeConfig, h) {
    if (!typeConfig) {
      return h.redirect(ROUTES.ADMIN.ORGANISATIONS)
    }
    return null
  }

  /**
   * GET handler for organisation forms
   */
  async get(request, h) {
    const { orgType, encodedId } = request.params
    const typeConfig = this.getTypeConfig(orgType)

    const redirectResponse = this._validateTypeConfig(typeConfig, h)
    if (redirectResponse) return redirectResponse

    const isEditMode = !!encodedId
    const formData = request.yar.get(
      ORGANISATION_SESSION_KEYS.ORGANISATION_DATA
    )

    // Verify organisation type matches in edit mode
    if (isEditMode) {
      const typeError = verifyOrganisationType(formData, typeConfig.route)
      if (typeError) {
        return h.redirect(ROUTES.ADMIN.ORGANISATIONS)
      }
    }

    if (!formData?.areaType && !isEditMode) {
      return h.redirect(getOrganisationTypeSelectionPath())
    }

    return h.view(
      ADMIN_VIEWS.ORGANISATION_MANAGE,
      await this.buildViewData(request, typeConfig, {
        isEditMode,
        formData
      })
    )
  }

  /**
   * POST handler for organisation forms
   */
  async post(request, h) {
    const { orgType, encodedId } = request.params
    const typeConfig = this.getTypeConfig(orgType)

    const redirectResponse = this._validateTypeConfig(typeConfig, h)
    if (redirectResponse) return redirectResponse

    const isEditMode = !!encodedId
    let organisationId = null

    if (isEditMode) {
      organisationId = decodeUserId(encodedId)
      if (!organisationId) {
        return h.redirect(ROUTES.ADMIN.ORGANISATIONS)
      }
    }

    const { formData, apiPayload } = this.transformFormData(
      request.payload,
      typeConfig,
      organisationId,
      isEditMode
    )
    const fieldErrors = this.validateForm(formData, typeConfig)

    if (fieldErrors) {
      return h.view(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        await this.buildViewData(request, typeConfig, {
          isEditMode,
          formData,
          fieldErrors
        })
      )
    }

    const sessionData =
      request.yar.get(ORGANISATION_SESSION_KEYS.ORGANISATION_DATA) || {}
    request.yar.set(ORGANISATION_SESSION_KEYS.ORGANISATION_DATA, {
      ...sessionData,
      ...formData,
      areaType: typeConfig.type
    })

    try {
      await this.saveOrganisation(request, apiPayload, isEditMode)
      return this.handleSaveSuccess(request, h, isEditMode)
    } catch (error) {
      return this.handleSaveError(
        request,
        h,
        error,
        formData,
        typeConfig,
        isEditMode
      )
    }
  }

  /**
   * Transform raw payload to form data (for validation/display) and API payload (for submission)
   */
  transformFormData(payload, typeConfig, organisationId, isEditMode) {
    const endDate = this._extractEndDate(payload)
    const fields = typeConfig.fields || []

    // Build form data for validation
    const formData = this._buildFormData(payload, fields, endDate)

    // Build API payload
    const apiPayload = this._buildApiPayload(
      payload,
      typeConfig,
      fields,
      endDate,
      organisationId,
      isEditMode
    )

    return { formData, apiPayload }
  }

  /**
   * Extract end date components from payload
   * @private
   */
  _extractEndDate(payload) {
    return {
      day: payload['endDate-day'] || '',
      month: payload['endDate-month'] || '',
      year: payload['endDate-year'] || ''
    }
  }

  /**
   * Build form data for validation
   * @private
   */
  _buildFormData(payload, fields, endDate) {
    const formData = { name: payload.name || '', endDate }
    fields.forEach((field) => {
      formData[field] = payload[field] || ''
    })
    return formData
  }

  /**
   * Build API payload for submission
   * @private
   */
  _buildApiPayload(
    payload,
    typeConfig,
    fields,
    endDate,
    organisationId,
    isEditMode
  ) {
    const apiPayload = {
      areaType: typeConfig.type,
      name: (payload.name || '').trim(),
      endDate: dateToISOString(endDate)
    }

    this._addFieldsToPayload(apiPayload, fields, payload)

    if (isEditMode && organisationId) {
      apiPayload.id = String(organisationId)
    }

    return apiPayload
  }

  /**
   * Add multiple fields to API payload
   * @private
   */
  _addFieldsToPayload(apiPayload, fields, payload) {
    fields.forEach((field) => {
      this._addFieldToPayload(apiPayload, field, payload[field])
    })
  }

  /**
   * Add field to API payload with appropriate transformation
   * @private
   */
  _addFieldToPayload(apiPayload, field, value) {
    if (!value) return

    if (field === 'identifier' || field === 'subType') {
      const trimmedValue = value.trim()
      if (trimmedValue) {
        apiPayload[field] = trimmedValue
      }
    } else if (field === 'parentId') {
      apiPayload[field] = String(value)
    }
  }

  /**
   * Validate form data and return errors if invalid
   */
  validateForm(formData, typeConfig) {
    const { error } = typeConfig.schema.validate(formData, {
      abortEarly: false
    })

    if (!error) {
      return null
    }

    return extractJoiErrors(error)
  }

  /**
   * Save organisation to backend
   */
  async saveOrganisation(request, apiPayload, isEditMode) {
    // Check if data changed from session originalData
    if (isEditMode) {
      const sessionData = request.yar.get(
        ORGANISATION_SESSION_KEYS.ORGANISATION_DATA
      )
      const { hasChanges } = detectChanges(sessionData)

      if (!hasChanges) {
        return
      }
    }

    const areasService = createAreasService(request.server)
    const accessToken = getAuthSession(request)?.accessToken || ''

    await areasService.upsertArea({
      data: apiPayload,
      accessToken
    })
  }

  /**
   * Handle successful save
   */
  handleSaveSuccess(request, h, isEditMode) {
    request.yar.clear(ORGANISATION_SESSION_KEYS.ORGANISATION_DATA)
    request.yar.flash('success', {
      message: isEditMode
        ? request.t('organisations.listing.notifications.organisation_updated')
        : request.t('organisations.listing.notifications.organisation_added')
    })
    return h.redirect(ROUTES.ADMIN.ORGANISATIONS)
  }

  /**
   * Handle save error
   */
  async handleSaveError(request, h, error, formData, typeConfig, isEditMode) {
    request.logger?.error(
      `Error ${isEditMode ? 'updating' : 'creating'} ${typeConfig.type}:`,
      error
    )

    // Check if this is an API response with validation errors
    if (error.response?.data?.validationErrors) {
      const fieldErrors = extractApiValidationErrors(error.response.data)
      return h.view(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        await this.buildViewData(request, typeConfig, {
          isEditMode,
          formData,
          fieldErrors
        })
      )
    }

    // Handle API error code or unexpected errors
    const apiError = error.response?.data
      ? extractApiError(error.response.data)
      : null
    const errorCode = apiError?.errorCode || 'SAVE_FAILED'

    return h.view(
      ADMIN_VIEWS.ORGANISATION_MANAGE,
      await this.buildViewData(request, typeConfig, {
        isEditMode,
        formData,
        errorCode
      })
    )
  }
}

const controller = new OrganisationManageController()

export const organisationManageController = {
  getOrganisationHandler: (request, h) => controller.get(request, h),
  postOrganisationHandler: (request, h) => controller.post(request, h)
}
