const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readResponse(response) {
  if (response.ok) {
    return response.json()
  }

  let message = 'Something went wrong while talking to the TraceMind API.'

  try {
    const payload = await response.json()
    if (payload?.detail) {
      message = payload.detail
    }
  } catch {
    message = response.statusText || message
  }

  throw new ApiError(message, response.status)
}

export async function fetchRecentAnalyses() {
  throw new Error('Saved analysis browsing is not enabled in the current TraceMind AI demo build.')
}

export async function generateQAPackage(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-qa-package`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return readResponse(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    const networkError = new Error(
      'Unable to reach the TraceMind AI backend at http://127.0.0.1:8000. Start the FastAPI server or continue with local sample output.',
    )
    networkError.code = 'NETWORK_ERROR'
    throw networkError
  }
}
