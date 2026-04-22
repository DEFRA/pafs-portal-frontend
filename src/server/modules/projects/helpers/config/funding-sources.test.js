import { describe, it, expect } from 'vitest'
import { FUNDING_SOURCES_CONFIG } from './funding-sources.js'

describe('FUNDING_SOURCES_CONFIG', () => {
  it('exports config for all 6 funding source steps', () => {
    const keys = Object.keys(FUNDING_SOURCES_CONFIG)
    expect(keys).toHaveLength(6)
  })

  it('every step has localKeyPrefix and schema', () => {
    for (const [step, config] of Object.entries(FUNDING_SOURCES_CONFIG)) {
      expect(config.localKeyPrefix, `${step} localKeyPrefix`).toBeTruthy()
      expect(config.schema, `${step} schema`).toBeDefined()
    }
  })

  describe('backLinkFn branches', () => {
    // Step 3: public contributors – back depends on additionalFcermGia
    it('public contributors: returns additional route when additionalFcermGia is true', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-public-contributors']
      const result = config.backLinkOptions.backLinkFn({
        additionalFcermGia: true
      })
      expect(result).toContain('additional')
    })

    it('public contributors: returns main route when additionalFcermGia is false', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-public-contributors']
      const result = config.backLinkOptions.backLinkFn({
        additionalFcermGia: false
      })
      expect(result).toContain('funding-sources')
      expect(result).not.toContain('additional')
    })

    // Step 4: private contributors – back depends on publicContributions
    it('private contributors: returns public route when publicContributions is true', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-private-contributors']
      const result = config.backLinkOptions.backLinkFn({
        publicContributions: true
      })
      expect(result).toContain('public')
    })

    it('private contributors: falls through to additional when publicContributions false and additionalFcermGia true', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-private-contributors']
      const result = config.backLinkOptions.backLinkFn({
        publicContributions: false,
        additionalFcermGia: true
      })
      expect(result).toContain('additional')
    })

    it('private contributors: falls through to main when all false', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-private-contributors']
      const result = config.backLinkOptions.backLinkFn({
        publicContributions: false,
        additionalFcermGia: false
      })
      expect(result).not.toContain('public')
      expect(result).not.toContain('additional')
    })

    // Step 5: other EA contributors – back depends on privateContributions
    it('other EA contributors: returns private route when privateContributions is true', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-other-ea-contributors']
      const result = config.backLinkOptions.backLinkFn({
        privateContributions: true
      })
      expect(result).toContain('private')
    })

    it('other EA contributors: falls through to public when private false but public true', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-other-ea-contributors']
      const result = config.backLinkOptions.backLinkFn({
        privateContributions: false,
        publicContributions: true
      })
      expect(result).toContain('public')
    })

    it('other EA contributors: falls through to main when all false', () => {
      const config =
        FUNDING_SOURCES_CONFIG['funding-sources-other-ea-contributors']
      const result = config.backLinkOptions.backLinkFn({
        privateContributions: false,
        publicContributions: false,
        additionalFcermGia: false
      })
      expect(result).not.toContain('private')
      expect(result).not.toContain('public')
      expect(result).not.toContain('additional')
    })

    // Step 6: estimated spend – back depends on otherEaContributions
    it('estimated spend: returns other EA route when otherEaContributions is true', () => {
      const config = FUNDING_SOURCES_CONFIG['funding-sources-estimated-spend']
      const result = config.backLinkOptions.backLinkFn({
        otherEaContributions: true
      })
      expect(result).toContain('other')
    })

    it('estimated spend: falls through to private when otherEa false but private true', () => {
      const config = FUNDING_SOURCES_CONFIG['funding-sources-estimated-spend']
      const result = config.backLinkOptions.backLinkFn({
        otherEaContributions: false,
        privateContributions: true
      })
      expect(result).toContain('private')
    })

    it('estimated spend: falls through to main when all false', () => {
      const config = FUNDING_SOURCES_CONFIG['funding-sources-estimated-spend']
      const result = config.backLinkOptions.backLinkFn({
        otherEaContributions: false,
        privateContributions: false,
        publicContributions: false,
        additionalFcermGia: false
      })
      expect(result).not.toContain('other')
      expect(result).not.toContain('private')
      expect(result).not.toContain('public')
      expect(result).not.toContain('additional')
    })

    // Null/undefined project edge cases
    it('back link functions handle null project gracefully', () => {
      const steps = [
        'funding-sources-public-contributors',
        'funding-sources-private-contributors',
        'funding-sources-other-ea-contributors',
        'funding-sources-estimated-spend'
      ]
      for (const step of steps) {
        const config = FUNDING_SOURCES_CONFIG[step]
        if (config.backLinkOptions.backLinkFn) {
          expect(() => config.backLinkOptions.backLinkFn(null)).not.toThrow()
          expect(() =>
            config.backLinkOptions.backLinkFn(undefined)
          ).not.toThrow()
        }
      }
    })
  })

  describe('step field types', () => {
    it('step 1 and 2 are checkbox type', () => {
      expect(FUNDING_SOURCES_CONFIG['funding-sources'].fieldType).toBe(
        'checkbox'
      )
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-additional'].fieldType
      ).toBe('checkbox')
    })

    it('contributor steps have contributor-names field type', () => {
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-public-contributors'].fieldType
      ).toBe('contributor-names')
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-private-contributors'].fieldType
      ).toBe('contributor-names')
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-other-ea-contributors']
          .fieldType
      ).toBe('contributor-names')
    })

    it('estimated spend step has spending-table field type', () => {
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-estimated-spend'].fieldType
      ).toBe('spending-table')
    })
  })

  describe('gate fields', () => {
    it('additional step gates on additionalFcermGia', () => {
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-additional'].gateField
      ).toBe('additionalFcermGia')
    })

    it('public contributors gates on publicContributions', () => {
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-public-contributors'].gateField
      ).toBe('publicContributions')
    })

    it('private contributors gates on privateContributions', () => {
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-private-contributors'].gateField
      ).toBe('privateContributions')
    })

    it('other EA contributors gates on otherEaContributions', () => {
      expect(
        FUNDING_SOURCES_CONFIG['funding-sources-other-ea-contributors']
          .gateField
      ).toBe('otherEaContributions')
    })
  })
})
