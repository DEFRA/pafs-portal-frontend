import { PROJECT_STEPS } from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'

/**
 * Step sequence for NFM section
 * Maps each step to the next step's route
 * Use null for steps that require conditional navigation (handled by redirect-helpers)
 */
export const NFM_STEP_SEQUENCE = {
  [PROJECT_STEPS.NFM_SELECTED_MEASURES]:
    ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION, // Always goes to river restoration first
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: null // Conditional - next measure or overview
  // Add more steps here as they are implemented
}

/**
 * Get dynamic back link for NFM steps
 * @param {string} step - Current project step
 * @param {Object} sessionData - Project session data
 * @returns {Object|null} Back link options or null
 */
export function getDynamicBackLink(step, sessionData) {
  // Add conditional back link logic here as needed
  // For now, all NFM steps use static back links from config
  return null
}
