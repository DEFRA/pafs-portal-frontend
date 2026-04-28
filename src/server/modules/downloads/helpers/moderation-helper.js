import { format } from 'date-fns'
import { URGENCY_REASON_LABELS } from '../../../common/constants/projects.js'

const NEW_PROJECT_THRESHOLD_MS = 5000
const DATE_FORMAT = 'd MMMM yyyy'
const SECTION_DIVIDER = '------------------------------------------------------'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildDateLabel(createdAt, updatedAt) {
  const createdDate = createdAt ? new Date(createdAt) : null
  const updatedDate = updatedAt ? new Date(updatedAt) : null

  const isNewProject =
    createdDate &&
    updatedDate &&
    Math.abs(updatedDate - createdDate) < NEW_PROJECT_THRESHOLD_MS

  return isNewProject
    ? `* Date created: ${format(createdDate, DATE_FORMAT)}`
    : `* Last updated: ${format(updatedDate ?? new Date(), DATE_FORMAT)}`
}

// ---------------------------------------------------------------------------
// Content builder
// ---------------------------------------------------------------------------

export function buildModerationText({
  referenceNumber,
  projectName,
  rmaName,
  eaAreaName,
  rfccName,
  urgencyReason,
  urgencyDetails,
  createdAt,
  updatedAt
}) {
  const urgencyReasonLabel =
    URGENCY_REASON_LABELS[urgencyReason] ?? urgencyReason

  const dateLabel = buildDateLabel(createdAt, updatedAt)

  const lines = [
    '===========================',
    'Urgency Moderation Evidence',
    '===========================',
    '',
    SECTION_DIVIDER,
    '* National Project Number',
    `  ${referenceNumber}`,
    '',
    '* Project Name',
    `  ${projectName}`,
    dateLabel,
    SECTION_DIVIDER,
    '* Risk Management Authority',
    `  ${rmaName ?? ''}`,
    '',
    '* Environment Agency Area',
    `  ${eaAreaName ?? ''}`,
    '',
    '* Regional Flood and Coastal Committee',
    `  ${rfccName ?? ''}`,
    '',
    SECTION_DIVIDER,
    '* Reason for Moderation Evidence',
    `  ${urgencyReasonLabel}`,
    '',
    '* Description',
    urgencyDetails ?? ''
  ]

  return lines.join('\r\n')
}

// ---------------------------------------------------------------------------
// HTTP response builder  (called by individual handler and future bulk handler)
// ---------------------------------------------------------------------------

export function buildModerationResponse(h, projectData, logger, statusCodes) {
  const referenceNumber = projectData.slug || projectData.referenceNumber || ''

  // Filename provided by the backend; fall back gracefully if absent
  const filename =
    projectData.moderationFilename ??
    `${referenceNumber.toUpperCase()}_moderation.txt`

  logger.info(
    { referenceNumber, filename },
    'Building urgency moderation evidence download'
  )

  const content = buildModerationText({
    referenceNumber,
    projectName: projectData.name ?? '',
    rmaName: projectData.rmaName ?? null,
    eaAreaName: projectData.eaAreaName ?? null,
    rfccName: projectData.rfccName ?? null,
    urgencyReason: projectData.urgencyReason ?? '',
    urgencyDetails: projectData.urgencyDetails ?? '',
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt
  })

  return h
    .response(content)
    .code(statusCodes.ok)
    .type('text/plain; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .header('Cache-Control', 'no-store')
}
