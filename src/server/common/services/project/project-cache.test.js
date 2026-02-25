import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  ProjectsCacheService,
  createProjectsCacheService
} from './project-cache.js'
import { CACHE_SEGMENTS } from '../../constants/common.js'

const DEFAULT_TTL = 1800000 // 30 minutes

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'session.cache.ttl') return 1800000
      if (key === 'session.cache.engine') return 'redis'
      if (key === 'pagination.defaultPageSize') return 10
      if (key === 'cacheFeatures.projects.project') return true
      if (key === 'cacheFeatures.projects.projectsList') return true
      return null
    })
  }
}))

vi.mock('../../helpers/logging/logger.js', () => {
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
  return {
    createLogger: () => logger
  }
})

vi.mock('../../helpers/pagination/index.js', () => ({
  getDefaultPageSize: vi.fn(() => 10)
}))

const { config } = await import('../../../../config/config.js')

describe('ProjectsCacheService', () => {
  let mockServer
  let mockCache
  let cacheService

  beforeEach(() => {
    vi.clearAllMocks()

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      drop: vi.fn()
    }

    mockServer = {
      cache: vi.fn(() => mockCache),
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    }

    config.get.mockImplementation((key) => {
      if (key === 'session.cache.engine') return 'redis'
      if (key === 'session.cache.ttl') return DEFAULT_TTL
      if (key === 'cacheFeatures.projects.project') return true
      if (key === 'cacheFeatures.projects.projectsList') return true
      return null
    })
    cacheService = new ProjectsCacheService(mockServer)
  })

  describe('constructor', () => {
    test('Should initialize with correct segment', () => {
      expect(cacheService.segment).toBe(CACHE_SEGMENTS.PROJECTS)
      expect(cacheService.server).toBe(mockServer)
    })
  })

  describe('generateProjectKey', () => {
    test('Should generate correct key for numeric id', () => {
      const key = cacheService.generateProjectKey(123)
      expect(key).toBe('project:123')
    })

    test('Should generate correct key for string id', () => {
      const key = cacheService.generateProjectKey('ABC123')
      expect(key).toBe('project:ABC123')
    })

    test('Should generate correct key for reference number', () => {
      const key = cacheService.generateProjectKey('RMS12345/ABC001')
      expect(key).toBe('project:RMS12345/ABC001')
    })
  })

  describe('generateListKey', () => {
    test('Should generate key with default values', () => {
      const key = cacheService.generateListKey({})
      expect(key).toBe('list::::1:10')
    })

    test('Should generate key with search parameter', () => {
      const key = cacheService.generateListKey({ search: 'flood' })
      expect(key).toBe('list:flood:::1:10')
    })

    test('Should generate key with areaId parameter', () => {
      const key = cacheService.generateListKey({ areaId: 5 })
      expect(key).toBe('list::5::1:10')
    })

    test('Should generate key with status parameter', () => {
      const key = cacheService.generateListKey({ status: 'submitted' })
      expect(key).toBe('list:::submitted:1:10')
    })

    test('Should generate key with page parameter', () => {
      const key = cacheService.generateListKey({ page: 2 })
      expect(key).toBe('list::::2:10')
    })

    test('Should generate key with pageSize parameter', () => {
      const key = cacheService.generateListKey({ pageSize: 25 })
      expect(key).toBe('list::::1:25')
    })

    test('Should generate key with all parameters', () => {
      const key = cacheService.generateListKey({
        search: 'coastal',
        areaId: 3,
        status: 'draft',
        page: 2,
        pageSize: 20
      })
      expect(key).toBe('list:coastal:3:draft:2:20')
    })

    test('Should handle empty string parameters as empty', () => {
      const key = cacheService.generateListKey({
        search: '',
        areaId: '',
        status: ''
      })
      expect(key).toBe('list::::1:10')
    })
  })

  describe('getProject', () => {
    test('Should retrieve cached project by id', async () => {
      const mockProject = { id: 1, name: 'Test Project' }
      mockCache.get.mockResolvedValue(mockProject)

      const result = await cacheService.getProject(1)

      expect(mockCache.get).toHaveBeenCalledWith('project:1')
      expect(result).toEqual(mockProject)
    })

    test('Should return null when project not in cache', async () => {
      mockCache.get.mockResolvedValue(null)

      const result = await cacheService.getProject(999)

      expect(result).toBeNull()
    })

    test('Should return null when project cache is disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      const result = await disabledService.getProject(1)

      expect(result).toBeNull()
    })

    test('Should return null when project cache is disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      const result = await disabledService.getProject(999)

      expect(result).toBeNull()
      expect(mockCache.get).not.toHaveBeenCalled()
    })

    test('Should handle string reference number', async () => {
      const mockProject = { referenceNumber: 'RMS12345/ABC001' }
      mockCache.get.mockResolvedValue(mockProject)

      await cacheService.getProject('RMS12345/ABC001')

      expect(mockCache.get).toHaveBeenCalledWith('project:RMS12345/ABC001')
    })
  })

  describe('setProject', () => {
    test('Should cache project with numeric id', async () => {
      const mockProject = { id: 1, name: 'Test Project' }

      await cacheService.setProject(1, mockProject)

      expect(mockCache.set).toHaveBeenCalledWith(
        'project:1',
        mockProject,
        DEFAULT_TTL
      )
    })

    test('Should cache project with string reference number', async () => {
      const mockProject = { referenceNumber: 'RMS12345/ABC001' }

      await cacheService.setProject('RMS12345/ABC001', mockProject)

      expect(mockCache.set).toHaveBeenCalledWith(
        'project:RMS12345/ABC001',
        mockProject,
        DEFAULT_TTL
      )
    })

    test('Should not cache when project cache is disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      await disabledService.setProject(1, { id: 1, name: 'Test' })

      expect(mockCache.set).not.toHaveBeenCalled()
    })
  })

  describe('getProjectsByIds', () => {
    test('Should retrieve multiple projects from cache', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' },
        { id: 3, name: 'Project 3' }
      ]

      mockCache.get
        .mockResolvedValueOnce(mockProjects[0])
        .mockResolvedValueOnce(mockProjects[1])
        .mockResolvedValueOnce(mockProjects[2])

      const result = await cacheService.getProjectsByIds([1, 2, 3])

      expect(result).toEqual(mockProjects)
      expect(mockCache.get).toHaveBeenCalledTimes(3)
    })

    test('Should return empty array when cache is disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      const result = await disabledService.getProjectsByIds([1, 2, 3])

      expect(result).toEqual([])
    })

    test('Should return empty array when ids is null', async () => {
      const result = await cacheService.getProjectsByIds(null)

      expect(result).toEqual([])
    })

    test('Should return empty array when ids is empty', async () => {
      const result = await cacheService.getProjectsByIds([])

      expect(result).toEqual([])
    })

    test('Should return null for missing projects', async () => {
      mockCache.get
        .mockResolvedValueOnce({ id: 1, name: 'Project 1' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 3, name: 'Project 3' })

      const result = await cacheService.getProjectsByIds([1, 2, 3])

      expect(result).toEqual([
        { id: 1, name: 'Project 1' },
        null,
        { id: 3, name: 'Project 3' }
      ])
    })
  })

  describe('setProjects', () => {
    test('Should cache multiple projects', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' }
      ]

      await cacheService.setProjects(mockProjects)

      expect(mockCache.set).toHaveBeenCalledTimes(2)
      expect(mockCache.set).toHaveBeenCalledWith(
        'project:1',
        mockProjects[0],
        DEFAULT_TTL
      )
      expect(mockCache.set).toHaveBeenCalledWith(
        'project:2',
        mockProjects[1],
        DEFAULT_TTL
      )
    })

    test('Should not cache when disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      await disabledService.setProjects([{ id: 1, name: 'Project 1' }])

      expect(mockCache.set).not.toHaveBeenCalled()
    })

    test('Should not cache when projects is null', async () => {
      await cacheService.setProjects(null)

      expect(mockCache.set).not.toHaveBeenCalled()
    })

    test('Should not cache when projects is empty', async () => {
      await cacheService.setProjects([])

      expect(mockCache.set).not.toHaveBeenCalled()
    })

    test('Should skip projects without id', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { name: 'Project without ID' },
        { id: 3, name: 'Project 3' }
      ]

      await cacheService.setProjects(mockProjects)

      expect(mockCache.set).toHaveBeenCalledTimes(2)
      expect(mockCache.set).toHaveBeenCalledWith(
        'project:1',
        mockProjects[0],
        DEFAULT_TTL
      )
      expect(mockCache.set).toHaveBeenCalledWith(
        'project:3',
        mockProjects[2],
        DEFAULT_TTL
      )
    })
  })

  describe('setListMetadata', () => {
    test('Should cache list metadata with project IDs', async () => {
      const params = { search: 'test', page: 1, pageSize: 10 }
      const projectIds = [1, 2, 3]
      const pagination = { page: 1, totalPages: 1, total: 3 }

      await cacheService.setListMetadata(params, projectIds, pagination)

      expect(mockCache.set).toHaveBeenCalledWith(
        'list:test:::1:10',
        expect.objectContaining({
          projectIds,
          pagination,
          timestamp: expect.any(Number)
        }),
        DEFAULT_TTL
      )
      expect(mockServer.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          segment: CACHE_SEGMENTS.PROJECTS,
          key: 'list:test:::1:10',
          projectCount: 3
        }),
        'Cached list metadata'
      )
    })

    test('Should not cache when disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      await disabledService.setListMetadata({}, [], {})

      expect(mockCache.set).not.toHaveBeenCalled()
    })

    test('Should include timestamp in metadata', async () => {
      const beforeTimestamp = Date.now()

      await cacheService.setListMetadata({}, [1, 2], {})

      const afterTimestamp = Date.now()
      const callArgs = mockCache.set.mock.calls[0][1]

      expect(callArgs.timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(callArgs.timestamp).toBeLessThanOrEqual(afterTimestamp)
    })
  })

  describe('getListMetadata', () => {
    test('Should retrieve cached list metadata', async () => {
      const mockMetadata = {
        projectIds: [1, 2, 3],
        pagination: { page: 1, total: 3 },
        timestamp: Date.now()
      }

      mockCache.get.mockResolvedValue(mockMetadata)

      const result = await cacheService.getListMetadata({
        search: 'test',
        page: 1
      })

      expect(result).toEqual(mockMetadata)
      expect(mockServer.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          segment: CACHE_SEGMENTS.PROJECTS,
          key: 'list:test:::1:10',
          projectCount: 3
        }),
        'List metadata cache hit'
      )
    })

    test('Should return null when metadata not in cache', async () => {
      mockCache.get.mockResolvedValue(null)

      const result = await cacheService.getListMetadata({ page: 1 })

      expect(result).toBeNull()
      expect(mockServer.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          segment: CACHE_SEGMENTS.PROJECTS,
          key: 'list::::1:10'
        }),
        'List metadata cache miss'
      )
    })

    test('Should return null when list cache is disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      const result = await disabledService.getListMetadata({ page: 1 })

      expect(result).toBeNull()
      expect(mockCache.get).not.toHaveBeenCalled()
    })

    test('Should log cache miss when metadata is null', async () => {
      mockCache.get.mockResolvedValue(null)

      await cacheService.getListMetadata({})

      expect(mockServer.logger.debug).toHaveBeenCalledWith(
        expect.any(Object),
        'List metadata cache miss'
      )
    })
  })

  describe('isProjectCacheEnabled', () => {
    test('Should return true when cache is enabled and feature flag is true', () => {
      const result = cacheService.isProjectCacheEnabled()

      expect(result).toBe(true)
    })

    test('Should return false when cache is disabled', () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      const result = disabledService.isProjectCacheEnabled()

      expect(result).toBe(false)
    })
  })

  describe('isListCacheEnabled', () => {
    test('Should return true when cache is enabled and feature flag is true', () => {
      const result = cacheService.isListCacheEnabled()

      expect(result).toBe(true)
    })

    test('Should return false when cache is disabled', () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      const result = disabledService.isListCacheEnabled()

      expect(result).toBe(false)
    })
  })

  describe('invalidateAll', () => {
    test('Should drop common cache keys for all statuses', async () => {
      await cacheService.invalidateAll()

      // Should drop common list patterns (default page size, no filters)
      expect(mockCache.drop).toHaveBeenCalledWith('list:::1:10')
      expect(mockCache.drop).toHaveBeenCalledWith('list::::1:10')
      expect(mockCache.drop).toHaveBeenCalledTimes(2)
    })

    test('Should not drop keys when cache is disabled', async () => {
      config.get.mockReturnValue('memory')
      const disabledService = new ProjectsCacheService(mockServer)

      await disabledService.invalidateAll()

      expect(mockCache.drop).not.toHaveBeenCalled()
    })

    test('Should log info message on successful invalidation', async () => {
      await cacheService.invalidateAll()

      expect(mockServer.logger.info).toHaveBeenCalledWith(
        { segment: CACHE_SEGMENTS.PROJECTS },
        'Invalidated common projects cache keys (lists)'
      )
    })
  })

  describe('createProjectsCacheService', () => {
    test('Should create new ProjectsCacheService instance', () => {
      const service = createProjectsCacheService(mockServer)

      expect(service).toBeInstanceOf(ProjectsCacheService)
      expect(service.server).toBe(mockServer)
      expect(service.segment).toBe(CACHE_SEGMENTS.PROJECTS)
    })
  })
})
