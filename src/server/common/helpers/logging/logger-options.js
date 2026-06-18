import { ecsFormat } from '@elastic/ecs-pino-format'
import { getTraceId } from '@defra/hapi-tracing'

import { config } from '../../../../config/config.js'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

const formatters = {
  ecs: {
    ...ecsFormat({
      serviceVersion,
      serviceName
    })
  },
  'pino-pretty': { transport: { target: 'pino-pretty' } }
}

const IGNORED_PATHS = new Set(['/health', '/health-detailed'])

export const loggerOptions = {
  enabled: logConfig.enabled,
  // ignorePaths and ignoreFunc are mutually exclusive in hapi-pino v13 —
  // when ignoreFunc is present it takes full control.  Health paths and
  // silently-dropped scanner probes are both handled here.
  ignoreFunc: (_opts, request) =>
    IGNORED_PATHS.has(request.path) || request.app?.silentDrop === true,
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin() {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}
