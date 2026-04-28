import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM,
  CONTRIBUTOR_SESSION_KEY,
  CONTRIBUTOR_NAMES_FIELD,
  CONTRIBUTOR_LEVEL
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { FUNDING_SOURCES_CONFIG } from '../../helpers/config/funding-sources.js'
import { saveProjectWithErrorHandling } from '../../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../../helpers/project-utils.js'
import {
  resolveBackLinkOptions,
  nextRouteAfterContributors
} from './navigation-helpers.js'
import { parseContributorsPayload } from './payload-helpers.js'
import {
  validateContributorNames,
  loadContributors,
  handleAddAction,
  handleRemoveAction
} from './contributor-helpers.js'

// ─── Controller Class ──────────────────────────────────────────────────────────

class ContributorsController {
  // ── Steps 3–5: Contributor names (shared GET handler) ─────────────────────

  async getContributors(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]

    if (!sessionData[config.gateField]) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const contributors = loadContributors(
      sessionData,
      sessionKey,
      namesField,
      step
    )

    updateSessionData(request, { [sessionKey]: contributors })

    const backLinkOptions = resolveBackLinkOptions(step, sessionData)
    const viewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions,
      additionalData: {
        step,
        contributors,
        sessionKey,
        deleteRoute: config.deleteRoute,
        fieldName: config.fieldName,
        PROJECT_PAYLOAD_FIELDS
      }
    })

    return h.view(PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS, viewData)
  }

  // ── Steps 3–5: Contributor names (shared POST handler) ────────────────────

  async postContributors(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params

    if (!sessionData[config.gateField]) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    const { action } = request.payload
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const sessionContributors = sessionData[sessionKey] || ['']

    if (action === 'add') {
      const redirectUrl = handleAddAction(
        request,
        sessionContributors,
        sessionKey,
        step
      )
      return h.redirect(redirectUrl).takeover()
    }

    if (typeof action === 'string' && action.startsWith('remove:')) {
      const removeIndex = Number.parseInt(action.split(':')[1], 10)
      const redirectUrl = handleRemoveAction(
        request,
        sessionContributors,
        sessionKey,
        step,
        removeIndex
      )
      return h.redirect(redirectUrl).takeover()
    }

    return this._validateAndSaveContributors(
      request,
      h,
      step,
      config,
      sessionKey,
      sessionContributors,
      referenceNumber
    )
  }

  /**
   * Validate submitted contributor names and save if valid.
   * @private
   */
  async _validateAndSaveContributors(
    request,
    h,
    step,
    config,
    sessionKey,
    sessionContributors,
    referenceNumber
  ) {
    const backLinkOptions = resolveBackLinkOptions(
      step,
      getSessionData(request)
    )
    const saveSubmitted = parseContributorsPayload(
      request.payload,
      sessionContributors
    )
    const cleanNames = saveSubmitted.map((n) =>
      typeof n === 'string' ? n.trim() : ''
    )
    const nonEmptyNames = cleanNames.filter((n) => n.length > 0)

    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const t = request.t.bind(request)
    const { fieldErrors, hasError } = validateContributorNames(
      cleanNames,
      nonEmptyNames,
      config,
      t
    )

    if (hasError) {
      updateSessionData(request, { [sessionKey]: cleanNames })
      const errorViewData = buildViewData(request, {
        localKeyPrefix: config.localKeyPrefix,
        backLinkOptions,
        additionalData: {
          step,
          contributors: cleanNames,
          sessionKey,
          deleteRoute: config.deleteRoute,
          fieldName: namesField,
          fieldErrors,
          PROJECT_PAYLOAD_FIELDS
        }
      })
      return h.view(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        errorViewData
      )
    }

    const joinedNames = nonEmptyNames.join(', ')
    updateSessionData(request, {
      [sessionKey]: cleanNames,
      [namesField]: joinedNames
    })

    const saveViewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions
    })

    const level = CONTRIBUTOR_LEVEL[step]
    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      level,
      saveViewData,
      PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    )
    if (saveError) {
      return saveError
    }

    const updated = getSessionData(request)
    return h
      .redirect(nextRouteAfterContributors(step, updated, referenceNumber))
      .takeover()
  }

  // ── Delete contributor: GET confirm page ──────────────────────────────────

  async getDeleteContributor(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const index = Number.parseInt(request.params.index, 10)
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const contributors = loadContributors(
      sessionData,
      sessionKey,
      namesField,
      step
    )
    const contributorName = contributors[index] || ''
    const contributorNumber = index + 1

    const contributorNamesRoute = config.deleteRoute
      .replace('/delete', '')
      .replace(REFERENCE_NUMBER_PARAM, request.params.referenceNumber)
    const backLinkOptions = {
      targetEditURL: contributorNamesRoute,
      conditionalRedirect: false
    }

    const viewData = buildViewData(request, {
      localKeyPrefix: 'projects.funding_sources.delete_contributor',
      backLinkOptions,
      additionalData: {
        step,
        index,
        contributorNumber,
        contributorName,
        cancelRoute: contributorNamesRoute
      }
    })

    return h.view(PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE, viewData)
  }

  // ── Delete contributor: POST confirm ──────────────────────────────────────

  async postDeleteContributor(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params
    const index = Number.parseInt(request.params.index, 10)
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const contributors = [
      ...loadContributors(sessionData, sessionKey, namesField, step)
    ]
    const contributorName = contributors[index] || ''
    const contributorNumber = index + 1

    const replace = (route) =>
      route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)

    const contributorNamesRoute = replace(
      config.deleteRoute.replace('/delete', '')
    )
    const backLinkOptions = {
      targetEditURL: contributorNamesRoute,
      conditionalRedirect: false
    }

    const backContributorsRoute = {
      [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]: replace(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS
      ),
      [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]: replace(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS
      ),
      [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]: replace(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES
          .OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS
      )
    }[step]

    if (!['yes', 'no'].includes(request.payload.confirm)) {
      const confirmViewData = buildViewData(request, {
        localKeyPrefix: 'projects.funding_sources.delete_contributor',
        backLinkOptions,
        additionalData: {
          step,
          index,
          contributorNumber,
          contributorName,
          cancelRoute: contributorNamesRoute,
          fieldErrors: {
            confirm: true
          }
        }
      })

      return h.view(
        PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE,
        confirmViewData
      )
    }

    if (request.payload.confirm === 'yes') {
      contributors.splice(index, 1)
      if (!contributors.length) {
        contributors.push('')
      }
      updateSessionData(request, { [sessionKey]: contributors })
    }

    return h.redirect(backContributorsRoute).takeover()
  }
}

// ─── Singleton + exported controller objects ────────────────────────────────

const ctrl = new ContributorsController()

export const publicContributorsController = {
  getHandler: (req, h) =>
    ctrl.getContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    )
}

export const privateContributorsController = {
  getHandler: (req, h) =>
    ctrl.getContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    )
}

export const otherEaContributorsController = {
  getHandler: (req, h) =>
    ctrl.getContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    )
}

export const publicContributorsDeleteController = {
  getHandler: (req, h) =>
    ctrl.getDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    )
}

export const privateContributorsDeleteController = {
  getHandler: (req, h) =>
    ctrl.getDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    )
}

export const otherEaContributorsDeleteController = {
  getHandler: (req, h) =>
    ctrl.getDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    )
}
