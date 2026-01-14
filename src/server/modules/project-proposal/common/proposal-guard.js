import { ROUTES } from '../../../common/constants/routes.js'

/**
 * Guard middleware to ensure project name has been provided
 * Redirects to project-name page if not found in session
 */
export const requireProjectName = {
  method: (request, h) => {
    const sessionData = request.yar.get('projectProposal') ?? {}
    const projectName = sessionData.projectName?.projectName

    if (!projectName) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_NAME).takeover()
    }

    return h.continue
  }
}

/**
 * Guard middleware to ensure project type has been selected
 * Redirects to project-name if project name is missing
 * Redirects to project-type page if project type is not found in session
 */
export const requireProjectType = {
  method: (request, h) => {
    const sessionData = request.yar.get('projectProposal') ?? {}
    const projectName = sessionData.projectName?.projectName
    const projectType = sessionData.projectType?.projectType

    if (!projectName) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_NAME).takeover()
    }

    if (!projectType) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE).takeover()
    }

    return h.continue
  }
}

/**
 * Guard middleware to ensure intervention types have been selected
 * Also validates that the project type is one that requires intervention types (DEF, REP, REF)
 * Redirects to the appropriate earlier step if prerequisites are not met
 */
export const requireInterventionType = {
  method: (request, h) => {
    const sessionData = request.yar.get('projectProposal') ?? {}
    const projectName = sessionData.projectName?.projectName
    const projectType = sessionData.projectType?.projectType
    const interventionTypes = sessionData.interventionTypes?.interventionTypes

    if (!projectName) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_NAME).takeover()
    }

    if (!projectType) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE).takeover()
    }

    // Verify project type is one that requires intervention types
    const validProjectTypes = ['DEF', 'REP', 'REF']
    if (!validProjectTypes.includes(projectType)) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE).takeover()
    }

    if (!interventionTypes || interventionTypes.length === 0) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE).takeover()
    }

    return h.continue
  }
}
/**
 * Guard middleware to ensure first financial year has been provided
 * Redirects to first-financial-year page if not found in session
 */
export const requireFirstFinancialYear = {
  method: (request, h) => {
    const sessionData = request.yar.get('projectProposal') ?? {}
    const firstFinancialYear =
      sessionData.firstFinancialYear?.firstFinancialYear

    if (!firstFinancialYear) {
      return h.redirect(ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR).takeover()
    }

    return h.continue
  }
}
