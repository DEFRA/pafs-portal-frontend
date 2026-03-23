export const PROJECT_STATUS = {
  REVISE: 'revise',
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
}

export const EDITABLE_STATUSES = [PROJECT_STATUS.DRAFT, PROJECT_STATUS.REVISE]

/**
 * Upload status values
 * Represents the current state of the file upload process
 */
export const UPLOAD_STATUS = {
  PENDING: 'pending', // Upload initiated but not started
  PROCESSING: 'processing', // Files being downloaded/processed by CDP
  INITIATED: 'initiated', // Upload session created
  READY: 'ready', // Upload complete and file available
  FAILED: 'failed' // Upload failed
}

export const URGENCY_REASONS = {
  NOT_URGENT: 'not_urgent',
  STATUTORY_NEED: 'statutory_need',
  LEGAL_NEED: 'legal_need',
  HEALTH_AND_SAFETY: 'health_and_safety',
  EMERGENCY_WORKS: 'emergency_works',
  TIME_LIMITED: 'time_limited'
}

export const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM_HIGH: 'medium_high',
  MEDIUM_LOW: 'medium_low',
  LOW: 'low',
  NOT_APPLICABLE: 'not_applicable'
}
