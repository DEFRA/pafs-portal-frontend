import { apiRequest } from '../../helpers/api-client.js'

export async function getAreas() {
  return apiRequest('/api/v1/areas', {
    method: 'GET'
  })
}
