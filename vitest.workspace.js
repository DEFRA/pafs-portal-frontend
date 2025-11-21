import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    // Unit tests - fast, isolated
    test: {
      name: 'unit',
      include: ['**/*.test.js'],
      exclude: ['**/*.integration.test.js', '**/node_modules/**'],
      environment: 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.js'],
        exclude: [
          'src/**/*.test.js',
          'src/**/*.integration.test.js',
          'src/index.js',
          'src/config/**',
          'src/server/server.js'
        ]
      }
    }
  },
  {
    // Integration tests - slower, real server
    test: {
      name: 'integration',
      include: ['**/*.integration.test.js'],
      environment: 'node',
      testTimeout: 10000
    }
  }
])
