import { pathToFileURL } from 'node:url'
import path from 'node:path'

export async function loadModules(server, basePath, patterns) {
  const modules = []

  for (const pattern of patterns) {
    const modulePath = path.join(basePath, pattern, 'index.js')

    try {
      // Convert to file URL for dynamic import
      const moduleUrl = pathToFileURL(modulePath).href
      const module = await import(moduleUrl)

      // Get the first exported plugin from the module
      const plugin = Object.values(module)[0]

      if (plugin) {
        modules.push(plugin)
      } else {
        server.logger.warn(
          { path: modulePath },
          'Module does not export a plugin'
        )
      }
    } catch (error) {
      server.logger.warn(
        { path: modulePath, error: error.message },
        'Failed to load module'
      )
    }
  }

  if (modules.length > 0) {
    await server.register(modules)
  }
}
