import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '../../config.js'
import { buildNavigation } from './build-navigation.js'
import { getAuthSession } from './session-helper.js'
import { createLogger } from '../../../server/common/helpers/logging/logger.js'
import { translate } from '../../../server/common/helpers/i18n/index.js'
import { needsCookiePolicyReacceptance } from '../../../server/common/helpers/cookie-policy/cookie-policy-helper.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

let webpackManifest

export function context(request) {
  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(error, `Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const session = getAuthSession(request)
  let navigation = []

  navigation = buildNavigation(request)

  // Check if cookie policy needs re-acceptance
  const needsReacceptance = needsCookiePolicyReacceptance(request)

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    breadcrumbs: [],
    navigation,
    user: session?.user,
    request,
    cookies: {
      ...(request.state || {}),
      needsReacceptance
    },
    t: (key, params) => translate(key, 'en', params),
    getAssetPath(asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}
