import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  ProjectsCacheService,
  createProjectsCacheService
} from './project-cache.js'
import { CACHE_SEGMENTS } from '../../constants/common.js'

vi.mock('../../helpers/pagination/index.js', () => ({
  getDefaultPageSize: vi.fn(() => 10)
}))

describe('ProjectsCacheService', () => {
  let mockServer
  let cacheService

  beforeEach(() => {
    mockServer = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn()
      },
      cache: vi.fn().mockReturnValue({
        get: vi.fn(),
        set: vi.fn(),
        drop: vi.fn()
      })
    }

    cacheService = new ProjectsCacheService(mockServer)
    // Mock the enabled flag for tests
    cacheService.enabled = true
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
      cacheService.getByKey = vi.fn().mockResolvedValue(mockProject)

      const result = await cacheService.getProject(1)

      expect(cacheService.getByKey).toHaveBeenCalledWith('project:1')
      expect(result).toEqual(mockProject)
    })

    test('Should return null when project not in cache', async () => {
      cacheService.getByKey = vi.fn().mockResolvedValue(null)

      const result = await cacheService.getProject(999)

      expect(result).toBeNull()
    })

    test('Should handle string reference number', async () => {
      const mockProject = { referenceNumber: 'RMS12345/ABC001' }
      cacheService.getByKey = vi.fn().mockResolvedValue(mockProject)

      await cacheService.getProject('RMS12345/ABC001')

      expect(cacheService.getByKey).toHaveBeenCalledWith(
        'project:RMS12345/ABC001'
      )
    })
  })

  describe('setProject', () => {
    test('Should cache project with numeric id', async () => {
      const mockProject = { id: 1, name: 'Test Project' }
      cacheService.setByKey = vi.fn().mockResolvedValue()

      await cacheService.setProject(1, mockProject)

      expect(cacheService.setByKey).toHaveBeenCalledWith(
        'project:1',
        mockProject
      )
    })

    test('Should cache project with string reference number', async () => {
      const mockProject = { referenceNumber: 'RMS12345/ABC001' }
      cacheService.setByKey = vi.fn().mockResolvedValue()

      await cacheService.setProject('RMS12345/ABC001', mockProject)

      expect(cacheService.setByKey).toHaveBeenCalledWith(
        'project:RMS12345/ABC001',
        mockProject
      )
    })
  })

  describe('getProjectsByIds', () => {
    test('Should retrieve multiple projects from cache', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' },
        { id: 3, name: 'Project 3' }
      ]

      cacheService.getProject = vi
        .fn()
        .mockResolvedValueOnce(mockProjects[0])
        .mockResolvedValueOnce(mockProjects[1])
        .mockResolvedValueOnce(mockProjects[2])

      const result = await cacheService.getProjectsByIds([1, 2, 3])

      expect(result).toEqual(mockProjects)
      expect(cacheService.getProject).toHaveBeenCalledTimes(3)
    })

    test('Should return empty array when cache is disabled', async () => {
      cacheService.enabled = false

      const result = await cacheService.getProjectsByIds([1, 2, 3])

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
      cacheService.getProject = vi
        .fn()
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

      cacheService.setProject = vi.fn().mockResolvedValue()

      await cacheService.setProjects(mockProjects)

      expect(cacheService.setProject).toHaveBeenCalledTimes(2)
      expect(cacheService.setProject).toHaveBeenCalledWith(1, mockProjects[0])
      expect(cacheService.setProject).toHaveBeenCalledWith(2, mockProjects[1])
    })

    test('Should not cache when disabled', async () => {
      cacheService.enabled = false
      cacheService.setProject = vi.fn()

      await cacheService.setProjects([{ id: 1, name: 'Project 1' }])

      expect(cacheService.setProject).not.toHaveBeenCalled()
    })

    test('Should not cache when projects is null', async () => {
      cacheService.setProject = vi.fn()

      await cacheService.setProjects(null)

      expect(cacheService.setProject).not.toHaveBeenCalled()
    })

    test('Should not cache when projects is empty', async () => {
      cacheService.setProject = vi.fn()

      await cacheService.setProjects([])

      expect(cacheService.setProject).not.toHaveBeenCalled()
    })

    test('Should skip projects without id', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { name: 'Project without ID' },
        { id: 3, name: 'Project 3' }
      ]

      cacheService.setProject = vi.fn().mockResolvedValue()

      await cacheService.setProjects(mockProjects)

      expect(cacheService.setProject).toHaveBeenCalledTimes(2)
      expect(cacheService.setProject).toHaveBeenCalledWith(1, mockProjects[0])
      expect(cacheService.setProject).toHaveBeenCalledWith(3, mockProjects[2])
    })
  })

  describe('setListMetadata', () => {
    test('Should cache list metadata with project IDs', async () => {
      const params = { search: 'test', page: 1, pageSize: 10 }
      const projectIds = [1, 2, 3]
      const pagination = { page: 1, totalPages: 1, total: 3 }

      cacheService.setByKey = vi.fn().mockResolvedValue()

      await cacheService.setListMetadata(params, projectIds, pagination)

      expect(cacheService.setByKey).toHaveBeenCalledWith(
        'list:test:::1:10',
        expect.objectContaining({
          projectIds,
          pagination,
          timestamp: expect.any(Number)
        })
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
      cacheService.enabled = false
      cacheService.setByKey = vi.fn()

      await cacheService.setListMetadata({}, [], {})

      expect(cacheService.setByKey).not.toHaveBeenCalled()
    })

    test('Should include timestamp in metadata', async () => {
      const beforeTimestamp = Date.now()
      cacheService.setByKey = vi.fn().mockResolvedValue()

      await cacheService.setListMetadata({}, [1, 2], {})

      const afterTimestamp = Date.now()
      const callArgs = cacheService.setByKey.mock.calls[0][1]

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

      cacheService.getByKey = vi.fn().mockResolvedValue(mockMetadata)

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
      cacheService.getByKey = vi.fn().mockResolvedValue(null)

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

    test('Should log cache miss when metadata is null', async () => {
      cacheService.getByKey = vi.fn().mockResolvedValue(null)

      await cacheService.getListMetadata({})

      expect(mockServer.logger.debug).toHaveBeenCalledWith(
        expect.any(Object),
        'List metadata cache miss'
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
