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

    test('FORGOT_PASSWORD route is defined', () => {
      expect(ROUTES.FORGOT_PASSWORD).toBe('/forgot-password')
    })

    test('FORGOT_PASSWORD_CONFIRMATION route is defined', () => {
      expect(ROUTES.FORGOT_PASSWORD_CONFIRMATION).toBe(
        '/forgot-password/confirmation'
      )
    })

    test('RESET_PASSWORD route is defined', () => {
      expect(ROUTES.RESET_PASSWORD).toBe('/reset-password')
    })

    test('RESET_PASSWORD_SUCCESS route is defined', () => {
      expect(ROUTES.RESET_PASSWORD_SUCCESS).toBe('/reset-password/success')
    })

    test('RESET_PASSWORD_TOKEN_EXPIRED route is defined', () => {
      expect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED).toBe(
        '/reset-password/token-expired'
      )
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

  describe('Project Proposal routes', () => {
    test('START_PROPOSAL route is defined', () => {
      expect(ROUTES.PROJECT_PROPOSAL.START_PROPOSAL).toBe(
        '/project-proposal/start'
      )
    })

    test('PROJECT_NAME route is defined', () => {
      expect(ROUTES.PROJECT_PROPOSAL.PROJECT_NAME).toBe(
        '/project-proposal/project-name'
      )
    })

    test('RMA_SELECTION route is defined', () => {
      expect(ROUTES.PROJECT_PROPOSAL.RMA_SELECTION).toBe(
        '/project-proposal/rma-selection'
      )
    })
  })

  describe('Route structure', () => {
    test('all auth routes are defined', () => {
      expect(ROUTES).toHaveProperty('LOGIN')
      expect(ROUTES).toHaveProperty('LOGOUT')
      expect(ROUTES).toHaveProperty('FORGOT_PASSWORD')
      expect(ROUTES).toHaveProperty('FORGOT_PASSWORD_CONFIRMATION')
      expect(ROUTES).toHaveProperty('RESET_PASSWORD')
      expect(ROUTES).toHaveProperty('RESET_PASSWORD_SUCCESS')
      expect(ROUTES).toHaveProperty('RESET_PASSWORD_TOKEN_EXPIRED')
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

    test('all project proposal routes are defined', () => {
      expect(ROUTES.PROJECT_PROPOSAL).toHaveProperty('START_PROPOSAL')
      expect(ROUTES.PROJECT_PROPOSAL).toHaveProperty('PROJECT_NAME')
      expect(ROUTES.PROJECT_PROPOSAL).toHaveProperty('RMA_SELECTION')
    })
  })
})
