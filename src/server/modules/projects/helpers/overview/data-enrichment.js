/**
 * Handle enrichment failure by recording error
 * @param {Array} errors - Array to collect errors
 * @param {Object} result - Enrichment result object
 */
function handleEnrichmentFailure(errors, result) {
  if (result.error) {
    errors.push(result.error)
  }
}

/**
 * Handle enrichment exception by logging and recording error
 * @param {Object} request - Hapi request object
 * @param {Array} errors - Array to collect errors
 * @param {Error} error - Exception that occurred
 * @param {Function} enrichmentFn - The enrichment function that failed
 */
function handleEnrichmentException(request, errors, error, enrichmentFn) {
  errors.push(error)
  request.server.logger.error(
    { err: error, enrichmentFn: enrichmentFn.name },
    'Data enrichment function failed'
  )
}

/**
 * Runs multiple data enrichment functions in sequence
 * Each function receives (request, projectData) and returns { success, projectData, error? }
 *
 * @param {Object} request - Hapi request object
 * @param {Object} initialProjectData - Initial project data
 * @param {Array<Function>} enrichmentFunctions - Array of enrichment functions to run
 * @returns {Promise<Object>} { success, projectData, errors }
 */
export async function enrichProjectData(
  request,
  initialProjectData,
  enrichmentFunctions = []
) {
  let projectData = initialProjectData
  const errors = []
  let overallSuccess = true

  for (const enrichmentFn of enrichmentFunctions) {
    try {
      const result = await enrichmentFn(request, projectData)

      // Handle failure case first (early continue pattern)
      if (!result.success) {
        overallSuccess = false
        handleEnrichmentFailure(errors, result)
        continue // Continue with existing projectData even if one enrichment fails
      }

      // Success case - update project data
      projectData = result.projectData
    } catch (error) {
      overallSuccess = false
      handleEnrichmentException(request, errors, error, enrichmentFn)
      // Continue with remaining enrichment functions
    }
  }

  return {
    success: overallSuccess,
    projectData,
    error: errors.length > 0 ? errors[0] : undefined, // Return first error for backward compatibility
    errors
  }
}
