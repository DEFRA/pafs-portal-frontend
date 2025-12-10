import { apiRequest } from '../../helpers/api-client.js'

export async function login(email, password) {
  return apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function refreshToken(token) {
  return apiRequest('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token })
  })
}

export async function logout(accessToken) {
  return apiRequest('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

export async function forgotPassword(email) {
  return apiRequest('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
}

export async function validateResetToken(token) {
  return apiRequest('/api/v1/auth/validate-token', {
    method: 'POST',
    body: JSON.stringify({ token, type: 'RESET' })
  })
}

export async function resetPassword(token, newPassword, confirmPassword) {
  return apiRequest('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password: newPassword, confirmPassword })
  })
}

export async function validateInvitationToken(token) {
  return apiRequest('/api/v1/auth/validate-token', {
    method: 'POST',
    body: JSON.stringify({ token, type: 'INVITATION' })
  })
}

export async function setPassword(token, newPassword, confirmPassword) {
  return apiRequest('/api/v1/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ token, password: newPassword, confirmPassword })
  })
}
