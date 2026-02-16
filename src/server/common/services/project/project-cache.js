import { BaseCacheService } from '../../helpers/cache/base-cache-service.js'
import { CACHE_SEGMENTS } from '../../constants/common.js'
import { getDefaultPageSize } from '../../helpers/pagination/index.js'
import { config } from '../../../../config/config.js'

export class ProjectsCacheService extends BaseCacheService {
  /**
   * @param {Object} server - Hapi server instance
   */
  constructor(server) {
    super(server, CACHE_SEGMENTS.PROJECTS)
  }

  /**
   * Check if project caching is enabled
   * @returns {boolean}
   */
  isProjectCacheEnabled() {
    return this.enabled && config.get('cacheFeatures.projects.project')
  }

  /**
   * Check if list caching is enabled
   * @returns {boolean}
   */
  isListCacheEnabled() {
    return this.enabled && config.get('cacheFeatures.projects.projectsList')
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
    if (!this.isProjectCacheEnabled()) {
      return null
    }
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
    if (!this.isProjectCacheEnabled()) {
      return
    }
    const key = this.generateProjectKey(id)
    await this.setByKey(key, project)
  }

  /**
   * Get multiple projects by IDs from cache
   * Returns projects that are cached, null for missing ones
   *
   * @param {Array<number|string>} ids - Array of project IDs
   * @returns {Promise<Array<Object|null>>} Array of projects (null for cache misses)
   */
  async getProjectsByIds(ids) {
    if (!this.isProjectCacheEnabled() || !ids || ids.length === 0) {
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
    if (!this.isProjectCacheEnabled() || !projects || projects.length === 0) {
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
    if (!this.isListCacheEnabled()) {
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
    if (!this.isListCacheEnabled()) {
      return null
    }

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

  /**
   * Invalidate all projects cache
   * Drops all known cache key patterns for projects, lists, and counts
   * @returns {Promise<void>}
   */
  async invalidateAll() {
    if (!this.enabled) {
      return
    }

    try {
      const defaultPageSize = getDefaultPageSize()
      // Drop common list patterns for all statuses
      const statusList = ['draft', 'submitted', 'archived']
      const listPromises = statusList.flatMap((status) => [
        // First page with default page size (most common)
        this.dropByKey(`list:${status}:::1:${defaultPageSize}`),
        // Count keys
        this.dropByKey(`count:${status}`)
      ])

      await Promise.all(listPromises)

      this.server.logger.info(
        { segment: this.segment },
        'Invalidated common projects cache keys (lists and counts)'
      )
    } catch (error) {
      this.server.logger.warn(
        { error, segment: this.segment },
        'Failed to invalidate projects cache'
      )
    }
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
