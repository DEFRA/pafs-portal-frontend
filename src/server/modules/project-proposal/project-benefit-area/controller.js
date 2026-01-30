class ProjectBenefitAreaController {
  async get(request, h) {
    // Logic for handling GET request for project benefit area
  }

  async post(request, h) {
    // Logic for handling POST request for project benefit area
  }
}

const controller = new ProjectBenefitAreaController()

export const projectBenefitAreaController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
