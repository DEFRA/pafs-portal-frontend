import { BaseCacheService } from '../../helpers/cache/base-cache-service.js'
import { CACHE_SEGMENTS } from '../../constants/common.js'

export class AreasCacheService extends BaseCacheService {
  constructor(server) {
    // Set TTL to 0 for no expiration - areas rarely change
    super(server, CACHE_SEGMENTS.AREAS, 0)
  }

  generateKey() {
    return 'areas-by-type'
  }

  async getAreasByType() {
    const key = this.generateKey()
    return this.getByKey(key)
  }

  async setAreasByType(areasData, ttl = 0) {
    const key = this.generateKey()
    return this.setByKey(key, areasData, ttl)
  }

  async invalidateAreas() {
    const key = this.generateKey()
    await this.dropByKey(key)
  }
}

export function createAreasCacheService(server) {
  return new AreasCacheService(server)
}
