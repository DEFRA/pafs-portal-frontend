import { CORE_PAYLOAD_LEVEL_FIELDS } from './payload-levels/core-fields.js'
import { IMPORTANT_DATES_PAYLOAD_LEVEL_FIELDS } from './payload-levels/important-dates-fields.js'
import { RISK_PROPERTIES_PAYLOAD_LEVEL_FIELDS } from './payload-levels/risk-properties-fields.js'
import { GOALS_CONFIDENCE_PAYLOAD_LEVEL_FIELDS } from './payload-levels/goals-confidence-fields.js'
import { ENVIRONMENTAL_BENEFITS_PAYLOAD_LEVEL_FIELDS } from './payload-levels/environmental-benefits-fields.js'
import { NFM_PAYLOAD_LEVEL_FIELDS } from './payload-levels/nfm-fields.js'

/**
 * Complete mapping of payload levels to their required fields for API submission.
 *
 * This object combines all feature-specific payload level mappings into a single
 * export for backward compatibility with existing code.
 */
export const PROJECT_PAYLOAD_LEVEL_FIELDS = {
  ...CORE_PAYLOAD_LEVEL_FIELDS,
  ...IMPORTANT_DATES_PAYLOAD_LEVEL_FIELDS,
  ...RISK_PROPERTIES_PAYLOAD_LEVEL_FIELDS,
  ...GOALS_CONFIDENCE_PAYLOAD_LEVEL_FIELDS,
  ...ENVIRONMENTAL_BENEFITS_PAYLOAD_LEVEL_FIELDS,
  ...NFM_PAYLOAD_LEVEL_FIELDS
}
