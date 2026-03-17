import { describe, test, expect } from 'vitest'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS,
  NFM_LAND_TYPES
} from '../../../../common/constants/projects.js'
import { getDynamicBackLink, NFM_STEP_SEQUENCE } from './navigation-helpers.js'

describe('nfm navigation helpers', () => {
  test('NFM_STEP_SEQUENCE exposes expected defaults', () => {
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_SELECTED_MEASURES]).toBe(
      ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION
    )
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_RIVER_RESTORATION]).toBeNull()
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_LEAKY_BARRIERS]).toBeNull()
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_LANDOWNER_CONSENT]).toBe(
      ROUTES.PROJECT.EDIT.NFM.EXPERIENCE
    )
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_EXPERIENCE]).toBe(
      ROUTES.PROJECT.EDIT.NFM.PROJECT_READINESS
    )
  })

  test('returns null for selected measures step', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_SELECTED_MEASURES, {})
    expect(result).toBeNull()
  })

  test('returns null for unknown step', () => {
    const result = getDynamicBackLink('unknown-step', {})
    expect(result).toBeNull()
  })

  test('river restoration goes back to selected measures', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_RIVER_RESTORATION, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'river_floodplain_restoration'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('falls back to selected measures when session has no selected measures field', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_WOODLAND, {})

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('leaky barriers goes back to river restoration when selected', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_LEAKY_BARRIERS, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'river_floodplain_restoration,leaky_barriers'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
      conditionalRedirect: false
    })
  })

  test('leaky barriers falls back to selected measures when river restoration not selected', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_LEAKY_BARRIERS, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: 'leaky_barriers'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('offline storage prefers leaky barriers as back link', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_OFFLINE_STORAGE, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'river_floodplain_restoration,leaky_barriers,offline_storage'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
      conditionalRedirect: false
    })
  })

  test('woodland prefers offline storage as back link', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_WOODLAND, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'leaky_barriers,offline_storage,woodland'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
      conditionalRedirect: false
    })
  })

  test('headwater drainage prefers woodland as back link', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_HEADWATER_DRAINAGE, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'woodland,headwater_drainage'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.WOODLAND,
      conditionalRedirect: false
    })
  })

  test('headwater drainage falls back to selected measures when no previous measure selected', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_HEADWATER_DRAINAGE, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: 'headwater_drainage'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('runoff management prefers headwater drainage as back link', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'headwater_drainage,runoff_management'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.HEADWATER_DRAINAGE,
      conditionalRedirect: false
    })
  })

  test('runoff management falls back to selected measures when no previous measure selected', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: 'runoff_management'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('saltmarsh prefers runoff management as back link', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_SALTMARSH, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'runoff_management,saltmarsh_management'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.RUNOFF_MANAGEMENT,
      conditionalRedirect: false
    })
  })

  test('saltmarsh falls back to selected measures when no previous measure selected', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_SALTMARSH, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: 'saltmarsh_management'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('sand dune prefers saltmarsh as back link', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_SAND_DUNE, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
        'saltmarsh_management,sand_dune_management'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SALTMARSH,
      conditionalRedirect: false
    })
  })

  test('sand dune falls back to selected measures when no previous measure selected', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_SAND_DUNE, {
      [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: 'sand_dune_management'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('handles null session data for measure steps', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_WOODLAND, null)

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
      conditionalRedirect: false
    })
  })

  test('land-use detail goes back to previous selected land type', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_LAND_USE_WOODLAND, {
      [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]:
        'enclosed_arable_farmland,woodland'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_ARABLE_FARMLAND,
      conditionalRedirect: false
    })
  })

  test('first selected land-use detail goes back to land-use-change', () => {
    const result = getDynamicBackLink(
      PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND,
      {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: [
          NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND,
          NFM_LAND_TYPES.WOODLAND
        ]
      }
    )

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    })
  })

  test('land-use detail with missing session falls back to land-use-change', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_LAND_USE_WOODLAND, null)

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    })
  })

  test('landowner consent goes back to last selected land-use detail', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_LANDOWNER_CONSENT, {
      [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]:
        'enclosed_arable_farmland,coastal_margins'
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_COASTAL_MARGINS,
      conditionalRedirect: false
    })
  })

  test('landowner consent falls back to land-use-change when no selected land types', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_LANDOWNER_CONSENT, {
      [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: ''
    })

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
      conditionalRedirect: false
    })
  })

  test('nfm experience goes back to landowner consent', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_EXPERIENCE, {})

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LANDOWNER_CONSENT,
      conditionalRedirect: false
    })
  })

  test('nfm project readiness goes back to experience', () => {
    const result = getDynamicBackLink(PROJECT_STEPS.NFM_PROJECT_READINESS, {})

    expect(result).toEqual({
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.EXPERIENCE,
      conditionalRedirect: false
    })
  })
})
