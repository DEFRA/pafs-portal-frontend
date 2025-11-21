import { describe, test, expect } from 'vitest'
import { ROUTES } from './routes.js'

describe('Routes Constants', () => {
  describe('Auth routes', () => {
    test('LOGIN route is defined', () => {
      expect(ROUTES.LOGIN).toBe('/login')
    })

    test('LOGOUT route is defined', () => {
      expect(ROUTES.LOGOUT).toBe('/logout')
    })
  })

  describe('General user routes', () => {
    test('HOME route is defined', () => {
      expect(ROUTES.GENERAL.HOME).toBe('/')
    })

    test('PROPOSALS route is defined', () => {
      expect(ROUTES.GENERAL.PROPOSALS).toBe('/')
    })

    test('DOWNLOAD route is defined', () => {
      expect(ROUTES.GENERAL.DOWNLOAD).toBe('/download')
    })

    test('ARCHIVE route is defined', () => {
      expect(ROUTES.GENERAL.ARCHIVE).toBe('/archive')
    })
  })

  describe('Admin routes', () => {
    test('JOURNEY_SELECTION route is defined', () => {
      expect(ROUTES.ADMIN.JOURNEY_SELECTION).toBe('/admin/journey-selection')
    })

    test('USERS route is defined', () => {
      expect(ROUTES.ADMIN.USERS).toBe('/admin/users')
    })

    test('PROJECTS route is defined', () => {
      expect(ROUTES.ADMIN.PROJECTS).toBe('/admin/projects')
    })

    test('SUBMISSIONS route is defined', () => {
      expect(ROUTES.ADMIN.SUBMISSIONS).toBe('/admin/submissions')
    })

    test('ORGANISATIONS route is defined', () => {
      expect(ROUTES.ADMIN.ORGANISATIONS).toBe('/admin/organisations')
    })

    test('DOWNLOAD_PROJECTS route is defined', () => {
      expect(ROUTES.ADMIN.DOWNLOAD_PROJECTS).toBe('/admin/download-projects')
    })

    test('DOWNLOAD_RMA route is defined', () => {
      expect(ROUTES.ADMIN.DOWNLOAD_RMA).toBe('/admin/download-rma')
    })
  })

  describe('Route structure', () => {
    test('all auth routes are defined', () => {
      expect(ROUTES).toHaveProperty('LOGIN')
      expect(ROUTES).toHaveProperty('LOGOUT')
    })

    test('all general routes are defined', () => {
      expect(ROUTES.GENERAL).toHaveProperty('HOME')
      expect(ROUTES.GENERAL).toHaveProperty('PROPOSALS')
      expect(ROUTES.GENERAL).toHaveProperty('DOWNLOAD')
      expect(ROUTES.GENERAL).toHaveProperty('ARCHIVE')
    })

    test('all admin routes are defined', () => {
      expect(ROUTES.ADMIN).toHaveProperty('JOURNEY_SELECTION')
      expect(ROUTES.ADMIN).toHaveProperty('USERS')
      expect(ROUTES.ADMIN).toHaveProperty('PROJECTS')
      expect(ROUTES.ADMIN).toHaveProperty('SUBMISSIONS')
      expect(ROUTES.ADMIN).toHaveProperty('ORGANISATIONS')
      expect(ROUTES.ADMIN).toHaveProperty('DOWNLOAD_PROJECTS')
      expect(ROUTES.ADMIN).toHaveProperty('DOWNLOAD_RMA')
    })
  })
})
