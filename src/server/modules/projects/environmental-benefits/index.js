import { ROUTES } from '../../../common/constants/routes.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { createConditionalPreHandler } from '../helpers/permissions.js'
import { environmentalBenefitsController } from './controller.js'

const controller = environmentalBenefitsController

/**
 * Environmental Benefits Plugin
 * Handles all environmental benefits gate and quantity questions
 * Uses conditional pre-handlers to ensure proper access control
 */
export const projectEnvironmentalBenefits = {
  plugin: {
    name: 'Project - Environmental Benefits',
    register(server) {
      // Pre-handler to ensure environmental benefits is enabled
      const requireEnvironmentalBenefitsEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Environmental benefits not enabled for this project'
      )

      // Pre-handlers for quantity fields - require gate field to be true
      const requireIntertidalHabitatEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Intertidal habitat not enabled'
      )

      const requireWoodlandEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.WOODLAND,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Woodland not enabled'
      )

      const requireWetWoodlandEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.WET_WOODLAND,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Wet woodland not enabled'
      )

      const requireWetlandOrWetGrasslandEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.WETLAND_OR_WET_GRASSLAND,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Wetland or wet grassland not enabled'
      )

      const requireGrasslandEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.GRASSLAND,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Grassland not enabled'
      )

      const requireHeathlandEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.HEATHLAND,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Heathland not enabled'
      )

      const requirePondsLakesEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.PONDS_LAKES,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Ponds and lakes not enabled'
      )

      const requireArableLandEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.ARABLE_LAND,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Arable land not enabled'
      )

      const requireComprehensiveRestorationEnabled =
        createConditionalPreHandler(
          PROJECT_PAYLOAD_FIELDS.COMPREHENSIVE_RESTORATION,
          true,
          ROUTES.PROJECT.OVERVIEW,
          'Comprehensive restoration not enabled'
        )

      const requirePartialRestorationEnabled = createConditionalPreHandler(
        PROJECT_PAYLOAD_FIELDS.PARTIAL_RESTORATION,
        true,
        ROUTES.PROJECT.OVERVIEW,
        'Partial restoration not enabled'
      )

      const requireCreateHabitatWatercourseEnabled =
        createConditionalPreHandler(
          PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE,
          true,
          ROUTES.PROJECT.OVERVIEW,
          'Create habitat watercourse not enabled'
        )

      server.route([
        // Main environmental benefits gate question
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS,
          controller
        ),

        // Intertidal habitat
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT,
          controller,
          [requireEnvironmentalBenefitsEnabled]
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT
            .HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
          controller,
          [requireEnvironmentalBenefitsEnabled, requireIntertidalHabitatEnabled]
        ),

        // Woodland
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.WOODLAND, controller, [
          requireEnvironmentalBenefitsEnabled
        ]),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
          controller,
          [requireEnvironmentalBenefitsEnabled, requireWoodlandEnabled]
        ),

        // Wet woodland
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.WET_WOODLAND, controller, [
          requireEnvironmentalBenefitsEnabled
        ]),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT
            .HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
          controller,
          [requireEnvironmentalBenefitsEnabled, requireWetWoodlandEnabled]
        ),

        // Wetland or wet grassland
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.WETLAND_OR_WET_GRASSLAND,
          controller,
          [requireEnvironmentalBenefitsEnabled]
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT
            .HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
          controller,
          [
            requireEnvironmentalBenefitsEnabled,
            requireWetlandOrWetGrasslandEnabled
          ]
        ),

        // Grassland
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.GRASSLAND, controller, [
          requireEnvironmentalBenefitsEnabled
        ]),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
          controller,
          [requireEnvironmentalBenefitsEnabled, requireGrasslandEnabled]
        ),

        // Heathland
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.HEATHLAND, controller, [
          requireEnvironmentalBenefitsEnabled
        ]),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
          controller,
          [requireEnvironmentalBenefitsEnabled, requireHeathlandEnabled]
        ),

        // Ponds and lakes
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.PONDS_LAKES, controller, [
          requireEnvironmentalBenefitsEnabled
        ]),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT
            .HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
          controller,
          [requireEnvironmentalBenefitsEnabled, requirePondsLakesEnabled]
        ),

        // Arable land
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.ARABLE_LAND, controller, [
          requireEnvironmentalBenefitsEnabled
        ]),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT
            .HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
          controller,
          [requireEnvironmentalBenefitsEnabled, requireArableLandEnabled]
        ),

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
            requireComprehensiveRestorationEnabled
          ]
        ),

        // Partial restoration
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.PARTIAL_RESTORATION,
          controller,
          [requireEnvironmentalBenefitsEnabled]
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT
            .KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
          controller,
          [
            requireEnvironmentalBenefitsEnabled,
            requirePartialRestorationEnabled
          ]
        ),

        // Create habitat watercourse
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CREATE_HABITAT_WATERCOURSE,
          controller,
          [requireEnvironmentalBenefitsEnabled]
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT
            .KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE,
          controller,
          [
            requireEnvironmentalBenefitsEnabled,
            requireCreateHabitatWatercourseEnabled
          ]
        )
      ])
    }
  }
}
