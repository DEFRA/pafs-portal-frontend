import { describe, test, expect, vi } from 'vitest'
import {
  adminDownloadGetController,
  adminDownloadGenerateController,
  adminDownloadPollController,
  adminDownloadFileController
} from './controller.js'

function makeH() {
  const redirectChain = {
    permanent: vi.fn().mockReturnValue('permanent-redirect')
  }
  return {
    redirect: vi.fn().mockReturnValue(redirectChain),
    _redirectChain: redirectChain
  }
}

describe('admin/programme-download redirect controllers', () => {
  const controllers = [
    {
      name: 'adminDownloadGetController',
      controller: adminDownloadGetController
    },
    {
      name: 'adminDownloadGenerateController',
      controller: adminDownloadGenerateController
    },
    {
      name: 'adminDownloadPollController',
      controller: adminDownloadPollController
    },
    {
      name: 'adminDownloadFileController',
      controller: adminDownloadFileController
    }
  ]

  for (const { name, controller } of controllers) {
    describe(name, () => {
      test('redirects permanently to /download', () => {
        const h = makeH()
        const result = controller.handler(null, h)

        expect(h.redirect).toHaveBeenCalledWith('/download')
        expect(h._redirectChain.permanent).toHaveBeenCalled()
        expect(result).toBe('permanent-redirect')
      })
    })
  }
})
