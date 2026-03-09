import { describe, test, expect } from 'vitest'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'
import { getDynamicBackLink, NFM_STEP_SEQUENCE } from './navigation-helpers.js'

describe('nfm navigation helpers', () => {
  test('NFM_STEP_SEQUENCE exposes expected defaults', () => {
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_SELECTED_MEASURES]).toBe(
      ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION
    )
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_RIVER_RESTORATION]).toBeNull()
    expect(NFM_STEP_SEQUENCE[PROJECT_STEPS.NFM_LEAKY_BARRIERS]).toBeNull()
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
})
