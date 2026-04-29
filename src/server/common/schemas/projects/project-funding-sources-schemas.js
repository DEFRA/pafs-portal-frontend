import Joi from 'joi'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VALIDATION_MESSAGES
} from '../../constants/projects.js'

const MAX_DIGITS = 18
const DIGITS_ONLY_REGEX = /^\d+$/
const NO_COMMA_REGEX = /^[^,]+$/

const ADDITIONAL_FCERM_GIA_FIELD = 'additionalFcermGia'
const PUBLIC_CONTRIBUTORS_FIELD = 'publicContributors'
const PRIVATE_CONTRIBUTORS_FIELD = 'privateContributors'
const OTHER_EA_CONTRIBUTORS_FIELD = 'otherEaContributors'

export const MAIN_FUNDING_SOURCE_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.FCERM_GIA,
  PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY,
  ADDITIONAL_FCERM_GIA_FIELD,
  PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED
]

export const ADDITIONAL_GIA_FUNDING_SOURCE_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE,
  PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING,
  PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES,
  PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID,
  PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT,
  PROJECT_PAYLOAD_FIELDS.RECOVERY,
  PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND
]

export const SPENDING_FUNDING_SOURCE_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.FCERM_GIA,
  PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY,
  PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED,
  ...ADDITIONAL_GIA_FUNDING_SOURCE_FIELDS
]

const validateSpendString = (value, helpers) => {
  if (!DIGITS_ONLY_REGEX.test(value)) {
    return helpers.error('string.pattern.base')
  }
  if (value.length > MAX_DIGITS) {
    return helpers.error('string.max')
  }
  return value
}

const createFundingSourceBoolSchema = (invalidMessage) =>
  Joi.boolean().strict().required().messages({
    'boolean.base': invalidMessage,
    'any.required': invalidMessage
  })

const createOptionalSpendSchema = (label) =>
  Joi.string()
    .trim()
    .allow(null, '')
    .optional()
    .custom((value, helpers) => validateSpendString(value, helpers))
    .label(label)
    .messages({
      'string.base':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'string.pattern.base':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'string.max':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_MAX_DIGITS
    })

const CONTRIBUTOR_TYPE_VALUES = [
  'public_contributions',
  'private_contributions',
  'other_ea_contributions'
]

const createContributorAmountSchema = () =>
  Joi.string()
    .trim()
    .required()
    .custom((value, helpers) => validateSpendString(value, helpers))
    .messages({
      'string.base':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'string.empty':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED,
      'any.required':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED,
      'string.pattern.base':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'string.max':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_MAX_DIGITS
    })

const fundingContributorSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.base':
      PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
    'string.empty':
      PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED,
    'any.required':
      PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED
  }),
  contributorType: Joi.string()
    .valid(...CONTRIBUTOR_TYPE_VALUES)
    .required()
    .messages({
      'string.base':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'any.only':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'any.required':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED
    }),
  amount: createContributorAmountSchema(),
  secured: Joi.boolean().optional(),
  constrained: Joi.boolean().optional()
}).options({ allowUnknown: false })

const createContributorsArraySchema = (contributorType) =>
  Joi.array()
    .items(
      fundingContributorSchema.keys({
        contributorType: Joi.string()
          .valid(contributorType)
          .required()
          .messages({
            'string.base':
              PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
            'any.only':
              PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
            'any.required':
              PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED
          })
      })
    )
    .optional()

const createContributorNamesSchema = (requiredMessage, invalidMessage) =>
  Joi.string().trim().min(1).pattern(NO_COMMA_REGEX).required().messages({
    'string.base': invalidMessage,
    'string.empty': requiredMessage,
    'string.min': requiredMessage,
    'string.pattern.base': invalidMessage,
    'any.required': requiredMessage
  })

const fundingSourceBoolSchema = createFundingSourceBoolSchema(
  PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_SELECTED_INVALID
)

export const fundingSourcesSelectedSchema = Joi.object(
  Object.fromEntries(
    MAIN_FUNDING_SOURCE_FIELDS.map((field) => [field, fundingSourceBoolSchema])
  )
)
  .custom((value, helpers) => {
    const hasAnyTrue = MAIN_FUNDING_SOURCE_FIELDS.some(
      (field) => value[field] === true
    )
    if (!hasAnyTrue) {
      return helpers.error('object.atLeastOneRequired')
    }
    return value
  })
  .messages({
    'object.atLeastOneRequired':
      PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_SELECTED_REQUIRED
  })
  .options({ allowUnknown: true })

const additionalGiaBoolSchema = createFundingSourceBoolSchema(
  PROJECT_VALIDATION_MESSAGES.ADDITIONAL_FUNDING_SOURCES_GIA_SELECTED_INVALID
)

export const additionalFcrmGiaSelectedSchema = Joi.object(
  Object.fromEntries(
    ADDITIONAL_GIA_FUNDING_SOURCE_FIELDS.map((field) => [
      field,
      additionalGiaBoolSchema
    ])
  )
)
  .custom((value, helpers) => {
    const hasAnyTrue = ADDITIONAL_GIA_FUNDING_SOURCE_FIELDS.some(
      (field) => value[field] === true
    )
    if (!hasAnyTrue) {
      return helpers.error('object.atLeastOneRequired')
    }
    return value
  })
  .messages({
    'object.atLeastOneRequired':
      PROJECT_VALIDATION_MESSAGES.ADDITIONAL_FUNDING_SOURCES_GIA_SELECTED_REQUIRED
  })
  .options({ allowUnknown: true })

export const publicContributorNamesSchema = createContributorNamesSchema(
  PROJECT_VALIDATION_MESSAGES.PUBLIC_SECTOR_CONTRIBUTORS_REQUIRED,
  PROJECT_VALIDATION_MESSAGES.PUBLIC_SECTOR_CONTRIBUTORS_INVALID
)

export const privateContributorNamesSchema = createContributorNamesSchema(
  PROJECT_VALIDATION_MESSAGES.PRIVATE_SECTOR_CONTRIBUTORS_REQUIRED,
  PROJECT_VALIDATION_MESSAGES.PRIVATE_SECTOR_CONTRIBUTORS_INVALID
)

export const otherEaContributorNamesSchema = createContributorNamesSchema(
  PROJECT_VALIDATION_MESSAGES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_REQUIRED,
  PROJECT_VALIDATION_MESSAGES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_INVALID
)

export const fundingValueRowSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_YEAR]: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'number.integer':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'any.required':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED
    }),
  [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.FCERM_GIA
  ),
  [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY
  ),
  [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS
  ),
  [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS
  ),
  [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS
  ),
  [PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED
  ),
  [PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE]:
    createOptionalSpendSchema(
      PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE
    ),
  [PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING]:
    createOptionalSpendSchema(
      PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING
    ),
  [PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES]:
    createOptionalSpendSchema(
      PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES
    ),
  [PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID]:
    createOptionalSpendSchema(
      PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID
    ),
  [PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT]:
    createOptionalSpendSchema(
      PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT
    ),
  [PROJECT_PAYLOAD_FIELDS.RECOVERY]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.RECOVERY
  ),
  [PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND
  ),
  [PUBLIC_CONTRIBUTORS_FIELD]: createContributorsArraySchema(
    'public_contributions'
  ),
  [PRIVATE_CONTRIBUTORS_FIELD]: createContributorsArraySchema(
    'private_contributions'
  ),
  [OTHER_EA_CONTRIBUTORS_FIELD]: createContributorsArraySchema(
    'other_ea_contributions'
  ),
  [PROJECT_PAYLOAD_FIELDS.TOTAL]: createOptionalSpendSchema(
    PROJECT_PAYLOAD_FIELDS.TOTAL
  )
}).options({ allowUnknown: true })

export const createFundingValuesSchema = (selectedSources = []) =>
  Joi.array()
    .items(fundingValueRowSchema)
    .min(1)
    .required()
    .custom((rows, helpers) => {
      for (const source of selectedSources) {
        const hasAtLeastOneNonZeroEntry = rows.some(
          (row) =>
            row[source] !== null &&
            row[source] !== undefined &&
            row[source] !== '' &&
            row[source] !== '0'
        )
        if (!hasAtLeastOneNonZeroEntry) {
          return helpers.error('array.sourceRequiresValue', { source })
        }
      }
      return rows
    })
    .messages({
      'array.min':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED,
      'array.base':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_INVALID,
      'array.sourceRequiresValue':
        PROJECT_VALIDATION_MESSAGES.FUNDING_SOURCES_ESTIMATED_SPEND_REQUIRED
    })
