class ProjectProposalStartController {
  get(request, h) {
    return h.view('project-proposal/start-proposal/index', {
      pageTitle: request.t('project-proposal.start_proposal.title'),
      heading: request.t('project-proposal.start_proposal.heading')
    })
  }
}

const controller = new ProjectProposalStartController()

export const projectProposalStartController = {
  handler: (request, h) => controller.get(request, h)
}
