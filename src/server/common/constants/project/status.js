export const PROJECT_STATUS = {
  REVISE: 'revise',
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
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

/**
 * Human-readable urgency reason labels for the moderation text report.
 */
export const URGENCY_REASON_LABELS = {
  [URGENCY_REASONS.STATUTORY_NEED]: 'A business critical statutory need',
  [URGENCY_REASONS.LEGAL_NEED]: 'A business critical legal need',
  [URGENCY_REASONS.HEALTH_AND_SAFETY]: 'A health and safety issue',
  [URGENCY_REASONS.EMERGENCY_WORKS]: 'An emergency',
  [URGENCY_REASONS.TIME_LIMITED]:
    'A specific aspect of the project has a time limit'
}

export const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM_HIGH: 'medium_high',
  MEDIUM_LOW: 'medium_low',
  LOW: 'low',
  NOT_APPLICABLE: 'not_applicable'
}
