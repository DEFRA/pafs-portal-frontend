import { BaseCacheService } from '../../helpers/cache/base-cache-service.js'
import { CACHE_SEGMENTS } from '../../constants/common.js'
import { getDefaultPageSize } from '../../helpers/pagination/index.js'

export class ProjectsCacheService extends BaseCacheService {
  constructor(server) {
    super(server, CACHE_SEGMENTS.PROJECTS)
  }

  /**
   * Generate cache key for a single project
   * @param {number|string} id - Project ID
   * @returns {string} Cache key
   */
  generateProjectKey(id) {
    return `project:${id}`
  }

  /**
   * Generate cache key for list metadata
   * @param {Object} params - Query parameters
   * @returns {string} Cache key
   */
  generateListKey(params) {
    const defaultPageSize = getDefaultPageSize()
    const {
      search = '',
      areaId = '',
      status = '',
      page = 1,
      pageSize = defaultPageSize
    } = params
    return `list:${search}:${areaId}:${status}:${page}:${pageSize}`
  }

  /**
   * Get a single cached project by ID
   *
   * @param {number|string} id - Project ID
   * @returns {Promise<Object|null>} Cached project or null
   */
  async getProject(id) {
    const key = this.generateProjectKey(id)
    return this.getByKey(key)
  }

  /**
   * Cache a single project
   *
   * @param {number|string} id - Project ID
   * @param {Object} project - Project data
   * @returns {Promise<void>}
   */
  async setProject(id, project) {
    const key = this.generateProjectKey(id)
    return this.setByKey(key, project)
  }

  /**
   * Get multiple projects by IDs from cache
   * Returns projects that are cached, null for missing ones
   *
   * @param {Array<number|string>} ids - Array of project IDs
   * @returns {Promise<Array<Object|null>>} Array of projects (null for cache misses)
   */
  async getProjectsByIds(ids) {
    if (!this.enabled || !ids || ids.length === 0) {
      return []
    }

    const promises = ids.map((id) => this.getProject(id))
    return Promise.all(promises)
  }

  /**
   * Cache multiple projects at once
   *
   * @param {Array<Object>} projects - Array of project objects (must have id field)
   * @returns {Promise<void>}
   */
  async setProjects(projects) {
    if (!this.enabled || !projects || projects.length === 0) {
      return
    }

    const promises = projects.map((project) => {
      const id = project.id
      return id ? this.setProject(id, project) : Promise.resolve()
    })

    await Promise.all(promises)
  }

  /**
   * Cache list metadata with project IDs
   * @param {Object} params - Query parameters
   * @param {Array<number>} projectIds - Array of project IDs
   * @param {Object} pagination - Pagination metadata
   * @returns {Promise<void>}
   */
  async setListMetadata(params, projectIds, pagination) {
    if (!this.enabled) {
      return
    }

    const metadata = {
      projectIds,
      pagination,
      timestamp: Date.now()
    }

    const key = this.generateListKey(params)
    await this.setByKey(key, metadata)

    this.server.logger.debug(
      { segment: this.segment, key, projectCount: projectIds.length },
      'Cached list metadata'
    )
  }

  /**
   * Get list metadata from cache
   * @param {Object} params - Query parameters
   * @returns {Promise<Object|null>} List metadata or null
   */
  async getListMetadata(params) {
    const key = this.generateListKey(params)
    const metadata = await this.getByKey(key)

    if (metadata) {
      this.server.logger.debug(
        {
          segment: this.segment,
          key,
          projectCount: metadata.projectIds?.length
        },
        'List metadata cache hit'
      )
    } else {
      this.server.logger.debug(
        { segment: this.segment, key },
        'List metadata cache miss'
      )
    }

    return metadata
  }
}

/**
 * Create projects cache service instance
 *
 * @param {Object} server - Hapi server instance
 * @returns {ProjectsCacheService}
 */
export function createProjectsCacheService(server) {
  return new ProjectsCacheService(server)
}
