import Joi from 'joi'
import {
  environmentalBenefitsSchema,
  intertidalHabitatSchema,
  hectaresOfIntertidalHabitatCreatedOrEnhancedSchema,
  woodlandSchema,
  hectaresOfWoodlandHabitatCreatedOrEnhancedSchema,
  wetWoodlandSchema,
  hectaresOfWetWoodlandHabitatCreatedOrEnhancedSchema,
  wetlandOrWetGrasslandSchema,
  hectaresOfWetlandOrWetGrasslandCreatedOrEnhancedSchema,
  grasslandSchema,
  hectaresOfGrasslandHabitatCreatedOrEnhancedSchema,
  heathlandSchema,
  hectaresOfHeathlandCreatedOrEnhancedSchema,
  pondsLakesSchema,
  hectaresOfPondOrLakeHabitatCreatedOrEnhancedSchema,
  arableLandSchema,
  hectaresOfArableLandLakeHabitatCreatedOrEnhancedSchema,
  comprehensiveRestorationSchema,
  kilometresOfWatercourseEnhancedOrCreatedComprehensiveSchema,
  partialRestorationSchema,
  kilometresOfWatercourseEnhancedOrCreatedPartialSchema,
  createHabitatWatercourseSchema,
  kilometresOfWatercourseEnhancedOrCreatedSingleSchema
} from '../../../common/schemas/projects.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

/**
 * Environmental benefits validation schemas
 * Includes: main gate, all habitat gates, and their quantity fields
 */

export const validateEnvironmentalBenefits = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: environmentalBenefitsSchema
})
  .options({ abortEarly: false })
  .label('Environmental Benefits')

export const validateIntertidalHabitat = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: intertidalHabitatSchema
})
  .options({ abortEarly: false })
  .label('Intertidal Habitat')

export const validateHectaresOfIntertidalHabitatCreatedOrEnhanced = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: intertidalHabitatSchema,
  [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
    hectaresOfIntertidalHabitatCreatedOrEnhancedSchema
})
  .options({ abortEarly: false })
  .label('Hectares Of Intertidal Habitat Created Or Enhanced')

export const validateWoodland = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.WOODLAND]: woodlandSchema
})
  .options({ abortEarly: false })
  .label('Woodland')

export const validateHectaresOfWoodlandHabitatCreatedOrEnhanced = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.WOODLAND]: woodlandSchema,
  [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
    hectaresOfWoodlandHabitatCreatedOrEnhancedSchema
})
  .options({ abortEarly: false })
  .label('Hectares Of Woodland Habitat Created Or Enhanced')

export const validateWetWoodland = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.WET_WOODLAND]: wetWoodlandSchema
})
  .options({ abortEarly: false })
  .label('Wet Woodland')

export const validateHectaresOfWetWoodlandHabitatCreatedOrEnhanced = Joi.object(
  {
    [PROJECT_PAYLOAD_FIELDS.WET_WOODLAND]: wetWoodlandSchema,
    [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
      hectaresOfWetWoodlandHabitatCreatedOrEnhancedSchema
  }
)
  .options({ abortEarly: false })
  .label('Hectares Of Wet Woodland Habitat Created Or Enhanced')

export const validateWetlandOrWetGrassland = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.WETLAND_OR_WET_GRASSLAND]: wetlandOrWetGrasslandSchema
})
  .options({ abortEarly: false })
  .label('Wetland Or Wet Grassland')

export const validateHectaresOfWetlandOrWetGrasslandCreatedOrEnhanced =
  Joi.object({
    [PROJECT_PAYLOAD_FIELDS.WETLAND_OR_WET_GRASSLAND]:
      wetlandOrWetGrasslandSchema,
    [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED]:
      hectaresOfWetlandOrWetGrasslandCreatedOrEnhancedSchema
  })
    .options({ abortEarly: false })
    .label('Hectares Of Wetland Or Wet Grassland Created Or Enhanced')

export const validateGrassland = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.GRASSLAND]: grasslandSchema
})
  .options({ abortEarly: false })
  .label('Grassland')

export const validateHectaresOfGrasslandHabitatCreatedOrEnhanced = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.GRASSLAND]: grasslandSchema,
  [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED]:
    hectaresOfGrasslandHabitatCreatedOrEnhancedSchema
})
  .options({ abortEarly: false })
  .label('Hectares Of Grassland Habitat Created Or Enhanced')

export const validateHeathland = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.HEATHLAND]: heathlandSchema
})
  .options({ abortEarly: false })
  .label('Heathland')

export const validateHectaresOfHeathlandCreatedOrEnhanced = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.HEATHLAND]: heathlandSchema,
  [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED]:
    hectaresOfHeathlandCreatedOrEnhancedSchema
})
  .options({ abortEarly: false })
  .label('Hectares Of Heathland Created Or Enhanced')

export const validatePondsLakes = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PONDS_LAKES]: pondsLakesSchema
})
  .options({ abortEarly: false })
  .label('Ponds Lakes')

export const validateHectaresOfPondOrLakeHabitatCreatedOrEnhanced = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PONDS_LAKES]: pondsLakesSchema,
  [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED]:
    hectaresOfPondOrLakeHabitatCreatedOrEnhancedSchema
})
  .options({ abortEarly: false })
  .label('Hectares Of Pond Or Lake Habitat Created Or Enhanced')

export const validateArableLand = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.ARABLE_LAND]: arableLandSchema
})
  .options({ abortEarly: false })
  .label('Arable Land')

export const validateHectaresOfArableLandLakeHabitatCreatedOrEnhanced =
  Joi.object({
    [PROJECT_PAYLOAD_FIELDS.ARABLE_LAND]: arableLandSchema,
    [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED]:
      hectaresOfArableLandLakeHabitatCreatedOrEnhancedSchema
  })
    .options({ abortEarly: false })
    .label('Hectares Of Arable Land Lake Habitat Created Or Enhanced')

export const validateComprehensiveRestoration = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.COMPREHENSIVE_RESTORATION]:
    comprehensiveRestorationSchema
})
  .options({ abortEarly: false })
  .label('Comprehensive Restoration')

export const validateKilometresOfWatercourseEnhancedOrCreatedComprehensive =
  Joi.object({
    [PROJECT_PAYLOAD_FIELDS.COMPREHENSIVE_RESTORATION]:
      comprehensiveRestorationSchema,
    [PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE]:
      kilometresOfWatercourseEnhancedOrCreatedComprehensiveSchema
  })
    .options({ abortEarly: false })
    .label('Kilometres Of Watercourse Enhanced Or Created Comprehensive')

export const validatePartialRestoration = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PARTIAL_RESTORATION]: partialRestorationSchema
})
  .options({ abortEarly: false })
  .label('Partial Restoration')

export const validateKilometresOfWatercourseEnhancedOrCreatedPartial =
  Joi.object({
    [PROJECT_PAYLOAD_FIELDS.PARTIAL_RESTORATION]: partialRestorationSchema,
    [PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL]:
      kilometresOfWatercourseEnhancedOrCreatedPartialSchema
  })
    .options({ abortEarly: false })
    .label('Kilometres Of Watercourse Enhanced Or Created Partial')

export const validateCreateHabitatWatercourse = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE]:
    createHabitatWatercourseSchema
})
  .options({ abortEarly: false })
  .label('Create Habitat Watercourse')

export const validateKilometresOfWatercourseEnhancedOrCreatedSingle =
  Joi.object({
    [PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE]:
      createHabitatWatercourseSchema,
    [PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE]:
      kilometresOfWatercourseEnhancedOrCreatedSingleSchema
  })
    .options({ abortEarly: false })
    .label('Kilometres Of Watercourse Enhanced Or Created Single')
