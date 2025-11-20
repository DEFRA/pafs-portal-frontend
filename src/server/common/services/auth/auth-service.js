import { apiRequest } from '../../helpers/api-client.js'

export async function login(email, password) {
  return await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function refreshToken(token) {
  return await apiRequest('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token })
  })
}

export async function logout(accessToken) {
  return await apiRequest('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}
