import inert from '@hapi/inert'

import { home } from './home/index.js'
import { health } from './health/index.js'
import { download } from './download/index.js'
import { archive } from './archive/index.js'
import { accountRequest } from './account_requests/account_request/index.js'
import { accountRequestDetails } from './account_requests/details/index.js'
import { accountRequestEaMainArea } from './account_requests/ea-main-area/index.js'
import { accountRequestEaAdditionalAreas } from './account_requests/ea-additional-areas/index.js'
import { accountRequestCheckAnswers } from './account_requests/check-answers/index.js'
import { accountRequestConfirmation } from './account_requests/confirmation/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([
        home,
        archive,
        download,
        accountRequest,
        accountRequestDetails,
        accountRequestEaMainArea,
        accountRequestEaAdditionalAreas,
        accountRequestCheckAnswers,
        accountRequestConfirmation
      ])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
