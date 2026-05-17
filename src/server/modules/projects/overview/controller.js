import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  EDITABLE_STATUSES,
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_RISK_TYPES,
  PROJECT_STEPS,
  PROJECT_TYPES,
  PROJECT_VIEW_ERROR_CODES,
  URGENCY_REASONS,
  CONFIDENCE_LEVELS,
  NFM_MEASURES,
  NFM_LANDOWNER_CONSENT_OPTIONS,
  NFM_EXPERIENCE_LEVEL_OPTIONS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  getBackLink,
  getSessionData,
  formatDate,
  formatNumberWithCommas,
  buildFinancialYearLabel,
  formatFileSize,
  getProjectStateTag,
  isConfidenceRestrictedProjectType,
  buildProcessedFundingValues,
  computeFundingSourceTotals
} from '../helpers/project-utils.js'
import { getCarbonImpactOverviewData } from '../helpers/overview/carbon-impact.js'
import {
  hasStaleFinancialYears,
  flushStaleFinancialYears
} from '../helpers/stale-financial-years.js'
import { submitProjectProposal } from '../../../common/services/project/project-service.js'

const SECTION_PROPOSAL_DETAILS = 'section-proposal-details'

// Maps backend submission error codes to { sectionId, localeKey }
const SUBMISSION_ERROR_MAP = {
  SUBMISSION_PROJECT_TYPE_INCOMPLETE: {
    sectionId: SECTION_PROPOSAL_DETAILS,
    localeKey: 'projects.overview.submission.errors.project_type_incomplete'
  },
  SUBMISSION_PROJECT_TYPE_BASIC_INCOMPLETE: {
    sectionId: SECTION_PROPOSAL_DETAILS,
    localeKey:
      'projects.overview.submission.errors.project_type_basic_incomplete'
  },
  SUBMISSION_FINANCIAL_START_YEAR_INCOMPLETE: {
    sectionId: SECTION_PROPOSAL_DETAILS,
    localeKey:
      'projects.overview.submission.errors.financial_start_year_incomplete'
  },
  SUBMISSION_FINANCIAL_END_YEAR_INCOMPLETE: {
    sectionId: SECTION_PROPOSAL_DETAILS,
    localeKey:
      'projects.overview.submission.errors.financial_end_year_incomplete'
  },
  SUBMISSION_FINANCIAL_END_YEAR_NOT_AFTER_START: {
    sectionId: SECTION_PROPOSAL_DETAILS,
    localeKey:
      'projects.overview.submission.errors.financial_end_year_not_after_start'
  },
  SUBMISSION_BENEFIT_AREA_INCOMPLETE: {
    sectionId: 'section-benefit-area',
    localeKey: 'projects.overview.submission.errors.benefit_area_incomplete'
  },
  SUBMISSION_IMPORTANT_DATES_INCOMPLETE: {
    sectionId: 'section-important-dates',
    localeKey: 'projects.overview.submission.errors.important_dates_incomplete'
  },
  SUBMISSION_IMPORTANT_DATES_OUT_OF_RANGE: {
    sectionId: 'section-important-dates',
    localeKey:
      'projects.overview.submission.errors.important_dates_out_of_range'
  },
  SUBMISSION_FUNDING_SOURCES_INCOMPLETE: {
    sectionId: 'section-funding-sources',
    localeKey: 'projects.overview.submission.errors.funding_sources_incomplete'
  },
  SUBMISSION_RISK_PROPERTIES_INCOMPLETE: {
    sectionId: 'section-risk-properties',
    localeKey: 'projects.overview.submission.errors.risk_properties_incomplete'
  },
  SUBMISSION_GOALS_INCOMPLETE: {
    sectionId: 'section-goals',
    localeKey: 'projects.overview.submission.errors.goals_incomplete'
  },
  SUBMISSION_ENVIRONMENTAL_BENEFITS_INCOMPLETE: {
    sectionId: 'section-environmental-benefits',
    localeKey:
      'projects.overview.submission.errors.environmental_benefits_incomplete'
  },
  SUBMISSION_NFM_INCOMPLETE: {
    sectionId: 'section-nfm',
    localeKey: 'projects.overview.submission.errors.nfm_incomplete'
  },
  SUBMISSION_URGENCY_INCOMPLETE: {
    sectionId: 'section-urgency',
    localeKey: 'projects.overview.submission.errors.urgency_incomplete'
  },
  SUBMISSION_WLC_INCOMPLETE: {
    sectionId: 'section-wlc',
    localeKey: 'projects.overview.submission.errors.wlc_incomplete'
  },
  SUBMISSION_WLB_INCOMPLETE: {
    sectionId: 'section-wlb',
    localeKey: 'projects.overview.submission.errors.wlb_incomplete'
  },
  SUBMISSION_CONFIDENCE_INCOMPLETE: {
    sectionId: 'section-confidence',
    localeKey: 'projects.overview.submission.errors.confidence_incomplete'
  },
  SUBMISSION_CARBON_INCOMPLETE: {
    sectionId: 'section-carbon',
    localeKey: 'projects.overview.submission.errors.carbon_incomplete'
  }
}

const GENERAL_ERROR_LOCALE = {
  NOT_ALLOWED_TO_SUBMIT: 'projects.overview.submission.errors.not_allowed',
  PROJECT_NOT_DRAFT: 'projects.overview.submission.errors.not_draft'
}

const GENERAL_ERROR_FALLBACK = 'projects.overview.submission.errors.save_failed'

/**
 * Build submission error data for the view from a failed API response.
 * Returns { submissionErrors, submissionErrorList } to pass to the template.
 * - submissionErrors: { [sectionId]: message } for inline section banners
 * - submissionErrorList: [{ text, href }] for govukErrorSummary
 */
const buildSubmissionErrorData = (result, t) => {
  const submissionErrors = {}
  const submissionErrorList = []

  // General (non-section) errors
  const generalError = result.errors?.[0]
  if (generalError) {
    const localeKey =
      GENERAL_ERROR_LOCALE[generalError.errorCode] ?? GENERAL_ERROR_FALLBACK
    submissionErrorList.push({
      text: t(localeKey),
      href: '#submission-heading'
    })
    submissionErrors.general = t(localeKey)
    return { submissionErrors, submissionErrorList }
  }

  // Section-level validation errors — deduplicate by sectionId (first error wins)
  const seen = new Set()
  for (const ve of result.validationErrors ?? []) {
    const mapping = SUBMISSION_ERROR_MAP[ve.errorCode]
    if (!mapping || seen.has(mapping.sectionId)) {
      continue
    }
    seen.add(mapping.sectionId)
    const message = t(mapping.localeKey)
    submissionErrors[mapping.sectionId] = message
    submissionErrorList.push({ text: message, href: `#${mapping.sectionId}` })
  }

  return { submissionErrors, submissionErrorList }
}

class OverviewController {
  _getProjectViewData(request, options = {}) {
    const { backLink, projectData } = options
    const session = getAuthSession(request)
    const isEaUser = Boolean(session?.user?.isEa)
    const isReadOnly =
      !EDITABLE_STATUSES.includes(projectData.projectState) || isEaUser
    const isLegacy = Boolean(projectData.isLegacy)
    const isConfidenceRestricted = isConfidenceRestrictedProjectType(
      projectData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    )
    return {
      pageTitle: request.t('projects.overview.heading'),
      backLinkURL: backLink.href,
      backLinkText: backLink.text,
      projectData,
      projectStateTag: getProjectStateTag(projectData.projectState),
      isReadOnly,
      isLegacy,
      isConfidenceRestricted,
      ERROR_CODES: PROJECT_VIEW_ERROR_CODES,
      fieldErrors: {},
      errorCode: '',
      columnWidth: 'full',
      PROJECT_TYPES,
      PROJECT_INTERVENTION_TYPES,
      PROJECT_RISK_TYPES,
      PROJECT_PAYLOAD_FIELDS,
      PROJECT_STEPS,
      NFM_MEASURES,
      NFM_LANDOWNER_CONSENT_OPTIONS,
      NFM_EXPERIENCE_LEVEL_OPTIONS,
      URGENCY_REASONS,
      CONFIDENCE_LEVELS,
      buildFinancialYearLabel,
      formatDate,
      formatNumberWithCommas,
      formatFileSize
    }
  }

  async get(request, h) {
    const backLink = getBackLink(request, {
      targetURL: ROUTES.PROJECT.HOME
    })
    let projectData = getSessionData(request)

    let staleFinancialYearsWarning = false
    if (
      EDITABLE_STATUSES.includes(projectData.projectState) &&
      hasStaleFinancialYears(projectData)
    ) {
      const flushed = await flushStaleFinancialYears(request)
      if (flushed) {
        projectData = getSessionData(request)
      }
    }
    // Show warning banner if the system previously cleared stale financial years and they
    // have not yet been re-entered (either year is still null).
    // staleDataCleared is persisted to DB — survives session expiry.
    if (
      projectData[PROJECT_PAYLOAD_FIELDS.STALE_DATA_CLEARED] === true &&
      (projectData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR] == null ||
        projectData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR] == null)
    ) {
      staleFinancialYearsWarning = true
    }

    const viewData = this._getProjectViewData(request, {
      backLink,
      projectData
    })

    const carbonResult = await getCarbonImpactOverviewData(request, projectData)

    viewData.projectData = carbonResult.projectData

    if (viewData.projectData) {
      viewData.projectData.processedFundingValues = buildProcessedFundingValues(
        viewData.projectData
      )
      viewData.projectData.fundingSourceTotals = computeFundingSourceTotals(
        viewData.projectData.processedFundingValues,
        viewData.projectData
      )
    }

    const [flashSuccess] = request.yar.flash('success')
    if (flashSuccess) {
      viewData.submissionSuccess = flashSuccess.message
    }

    viewData.staleFinancialYearsWarning = staleFinancialYearsWarning

    return h.view(PROJECT_VIEWS.OVERVIEW, viewData)
  }

  async post(request, h) {
    const backLink = getBackLink(request, { targetURL: ROUTES.PROJECT.HOME })
    const projectData = getSessionData(request)
    const slug = projectData?.[PROJECT_PAYLOAD_FIELDS.SLUG]

    const authSession = getAuthSession(request)
    const accessToken = authSession?.accessToken ?? ''

    const result = await submitProjectProposal(slug, accessToken)

    if (result?.success) {
      request.metrics?.counter('proposalSubmission', 1, { outcome: 'success' })
      request.yar.flash('success', {
        message: request.t('projects.overview.submission.submitted_message')
      })
      return h.redirect(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', slug)
      )
    }

    request.metrics?.counter('proposalSubmission', 1, { outcome: 'error' })

    // Build error view
    const { submissionErrors, submissionErrorList } = buildSubmissionErrorData(
      result,
      request.t.bind(request)
    )

    const viewData = this._getProjectViewData(request, {
      backLink,
      projectData
    })
    const carbonResult = await getCarbonImpactOverviewData(request, projectData)
    viewData.projectData = carbonResult.projectData

    if (viewData.projectData) {
      viewData.projectData.processedFundingValues = buildProcessedFundingValues(
        viewData.projectData
      )
      viewData.projectData.fundingSourceTotals = computeFundingSourceTotals(
        viewData.projectData.processedFundingValues,
        viewData.projectData
      )
    }

    viewData.submissionErrors = submissionErrors
    viewData.submissionErrorList = submissionErrorList
    return h.view(PROJECT_VIEWS.OVERVIEW, viewData)
  }
}

const controller = new OverviewController()

export const overviewController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
