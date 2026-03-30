import { describe, expect, test } from 'vitest'
import clearNfmFields from './clear-nfm-fields.js'

describe('clearNfmFields', () => {
  test('removes prefixed, named and array NFM fields', () => {
    const input = {
      NFM_test: 'x',
      nfm_test: 'y',
      pafs_core_nfm_test: 'z',
      nfmSelectedMeasures: ['measure-1'],
      nfmProjectReadiness: 'ready',
      pafs_core_nfm_measures: [{ id: 1 }],
      pafs_core_nfm_land_use_changes: [{ id: 2 }],
      keepMe: 'value'
    }

    const result = clearNfmFields(input)

    expect(result).toEqual({ keepMe: 'value' })
  })

  test('keeps non-NFM fields and does not mutate original object', () => {
    const input = {
      projectType: 'DEF',
      projectInterventionTypes: ['NFM'],
      keepMe: 'value',
      nfmLandownerConsent: true
    }

    const result = clearNfmFields(input)

    expect(result).toEqual({
      projectType: 'DEF',
      projectInterventionTypes: ['NFM'],
      keepMe: 'value'
    })
    expect(input).toEqual({
      projectType: 'DEF',
      projectInterventionTypes: ['NFM'],
      keepMe: 'value',
      nfmLandownerConsent: true
    })
  })

  test('returns empty object for undefined input', () => {
    expect(clearNfmFields(undefined)).toEqual({})
  })
})
