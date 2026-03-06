import { ROUTES } from '../../../common/constants/routes.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { createConditionalPreHandler } from '../helpers/permissions.js'
import { environmentalBenefitsController } from './controller.js'

const controller = environmentalBenefitsController

/**
 * Create base pre-handler for environmental benefits
 */
function createBasePreHandler() {
  return createConditionalPreHandler(
    PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS,
    true,
    ROUTES.PROJECT.OVERVIEW,
    'Environmental benefits not enabled for this project'
  )
}

/**
 * Create habitat-specific pre-handlers
 */
function createHabitatPreHandlers() {
  return {
    requireIntertidalHabitatEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Intertidal habitat not enabled'
    ),
    requireWoodlandEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.WOODLAND,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Woodland not enabled'
    ),
    requireWetWoodlandEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.WET_WOODLAND,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Wet woodland not enabled'
    ),
    requireWetlandOrWetGrasslandEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.WETLAND_OR_WET_GRASSLAND,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Wetland or wet grassland not enabled'
    ),
    requireGrasslandEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.GRASSLAND,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Grassland not enabled'
    ),
    requireHeathlandEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.HEATHLAND,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Heathland not enabled'
    ),
    requirePondsLakesEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.PONDS_LAKES,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Ponds and lakes not enabled'
    ),
    requireArableLandEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.ARABLE_LAND,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Arable land not enabled'
    )
  }
}

/**
 * Create watercourse restoration pre-handlers
 */
function createWatercoursePreHandlers() {
  return {
    requireComprehensiveRestorationEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.COMPREHENSIVE_RESTORATION,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Comprehensive restoration not enabled'
    ),
    requirePartialRestorationEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.PARTIAL_RESTORATION,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Partial restoration not enabled'
    ),
    requireCreateHabitatWatercourseEnabled: createConditionalPreHandler(
      PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE,
      true,
      ROUTES.PROJECT.OVERVIEW,
      'Create habitat watercourse not enabled'
    )
  }
}

/**
 * Create all pre-handlers for environmental benefits access control
 */
function createPreHandlers() {
  const requireEnvironmentalBenefitsEnabled = createBasePreHandler()
  const habitatPreHandlers = createHabitatPreHandlers()
  const watercoursePreHandlers = createWatercoursePreHandlers()

  return {
    requireEnvironmentalBenefitsEnabled,
    ...habitatPreHandlers,
    ...watercoursePreHandlers
  }
}

/**
 * Register main environmental benefits gate route
 */
function registerMainRoute() {
  return createEditRoutePair(
    ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS,
    controller
  )
}

/**
 * Register woodland-related habitat routes
 */
function registerWoodlandRoutes(requireEnvBenefits, preHandlers) {
  return [
    // Intertidal habitat
    ...createEditRoutePair(ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT, controller, [
      requireEnvBenefits
    ]),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requireIntertidalHabitatEnabled]
    ),

    // Woodland
    ...createEditRoutePair(ROUTES.PROJECT.EDIT.WOODLAND, controller, [
      requireEnvBenefits
    ]),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requireWoodlandEnabled]
    ),

    // Wet woodland
    ...createEditRoutePair(ROUTES.PROJECT.EDIT.WET_WOODLAND, controller, [
      requireEnvBenefits
    ]),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requireWetWoodlandEnabled]
    )
  ]
}

/**
 * Register grassland-related habitat routes
 */
function registerGrasslandRoutes(requireEnvBenefits, preHandlers) {
  return [
    // Wetland or wet grassland
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.WETLAND_OR_WET_GRASSLAND,
      controller,
      [requireEnvBenefits]
    ),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT
        .HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requireWetlandOrWetGrasslandEnabled]
    ),

    // Grassland
    ...createEditRoutePair(ROUTES.PROJECT.EDIT.GRASSLAND, controller, [
      requireEnvBenefits
    ]),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requireGrasslandEnabled]
    ),

    // Heathland
    ...createEditRoutePair(ROUTES.PROJECT.EDIT.HEATHLAND, controller, [
      requireEnvBenefits
    ]),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requireHeathlandEnabled]
    )
  ]
}

/**
 * Register other habitat routes (ponds/lakes, arable land)
 */
function registerOtherHabitatRoutes(requireEnvBenefits, preHandlers) {
  return [
    // Ponds and lakes
    ...createEditRoutePair(ROUTES.PROJECT.EDIT.PONDS_LAKES, controller, [
      requireEnvBenefits
    ]),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requirePondsLakesEnabled]
    ),

    // Arable land
    ...createEditRoutePair(ROUTES.PROJECT.EDIT.ARABLE_LAND, controller, [
      requireEnvBenefits
    ]),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT
        .HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
      controller,
      [requireEnvBenefits, preHandlers.requireArableLandEnabled]
    )
  ]
}

/**
 * Register all habitat-related routes
 */
function registerHabitatRoutes(preHandlers) {
  const requireEnvBenefits = preHandlers.requireEnvironmentalBenefitsEnabled

  return [
    ...registerMainRoute(),
    ...registerWoodlandRoutes(requireEnvBenefits, preHandlers),
    ...registerGrasslandRoutes(requireEnvBenefits, preHandlers),
    ...registerOtherHabitatRoutes(requireEnvBenefits, preHandlers)
  ]
}

/**
 * Register watercourse restoration routes
 */
function registerWatercourseRoutes(preHandlers) {
  const { requireEnvironmentalBenefitsEnabled } = preHandlers

  return [
    // Comprehensive restoration
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.COMPREHENSIVE_RESTORATION,
      controller,
      [requireEnvironmentalBenefitsEnabled]
    ),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT
        .KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE,
      controller,
      [
        requireEnvironmentalBenefitsEnabled,
        preHandlers.requireComprehensiveRestorationEnabled
      ]
    ),

    // Partial restoration
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.PARTIAL_RESTORATION,
      controller,
      [requireEnvironmentalBenefitsEnabled]
    ),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
      controller,
      [
        requireEnvironmentalBenefitsEnabled,
        preHandlers.requirePartialRestorationEnabled
      ]
    ),

    // Create habitat watercourse
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.CREATE_HABITAT_WATERCOURSE,
      controller,
      [requireEnvironmentalBenefitsEnabled]
    ),
    ...createEditRoutePair(
      ROUTES.PROJECT.EDIT.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE,
      controller,
      [
        requireEnvironmentalBenefitsEnabled,
        preHandlers.requireCreateHabitatWatercourseEnabled
      ]
    )
  ]
}

/**
 * Environmental Benefits Plugin
 * Handles all environmental benefits gate and quantity questions
 * Uses conditional pre-handlers to ensure proper access control
 */
export const projectEnvironmentalBenefits = {
  plugin: {
    name: 'Project - Environmental Benefits',
    register(server) {
      const preHandlers = createPreHandlers()

      server.route([
        ...registerHabitatRoutes(preHandlers),
        ...registerWatercourseRoutes(preHandlers)
      ])
    }
  }
}
