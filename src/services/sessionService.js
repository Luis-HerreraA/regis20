const DEFAULT_SESSION_DURATION_MS = 60 * 60 * 1000
const SESSION_EXPIRATION_KEY = 'sessionExpiresAt'
const SESSION_WARNING_KEY_PREFIX = 'sessionWarningShown:'

const SESSION_KEYS = [
  'userName',
  'sessionTime',
  'sessionLastUpdate',
  SESSION_EXPIRATION_KEY,
  'token',
  'mail',
  'userRole',
  'userId',
  'user_id',
  'userEmail',
  'userRut',
  'userData',
]

const getJwtDuration = (token) => {
  try {
    const payload = token?.split('.')[1]
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    )
    const binaryPayload = atob(paddedPayload)
    const bytes = Uint8Array.from(binaryPayload, (character) => character.charCodeAt(0))
    const decodedPayload = JSON.parse(new TextDecoder().decode(bytes))
    const issuedAt = Number(decodedPayload.iat)
    const expiration = Number(decodedPayload.exp)
    const duration = expiration - issuedAt

    return Number.isFinite(duration) && duration > 0 ? duration * 1000 : null
  } catch {
    return null
  }
}

export const startSession = (token, expiresInSeconds) => {
  const serverDuration = Number(expiresInSeconds)
  const jwtDuration = getJwtDuration(token)
  const expiration =
    Date.now() +
    (Number.isFinite(serverDuration) && serverDuration > 0
      ? serverDuration * 1000
      : jwtDuration || DEFAULT_SESSION_DURATION_MS)

  localStorage.setItem('token', token)
  localStorage.setItem(SESSION_EXPIRATION_KEY, expiration.toString())

  // Eliminar el formato anterior para que nunca se reutilice un contador vencido.
  localStorage.removeItem('sessionTime')
  localStorage.removeItem('sessionLastUpdate')
  sessionStorage.removeItem(`${SESSION_WARNING_KEY_PREFIX}warning`)
  sessionStorage.removeItem(`${SESSION_WARNING_KEY_PREFIX}critical`)
}

export const getRemainingSessionSeconds = () => {
  let expiration = Number(localStorage.getItem(SESSION_EXPIRATION_KEY))

  // Migrar una sesión activa creada por la versión anterior.
  if (!Number.isFinite(expiration) || expiration <= 0) {
    const legacyTime = Number(localStorage.getItem('sessionTime'))
    const legacyLastUpdate = Number(localStorage.getItem('sessionLastUpdate'))

    if (Number.isFinite(legacyTime) && legacyTime > 0 && Number.isFinite(legacyLastUpdate)) {
      expiration = legacyLastUpdate + legacyTime * 1000
      localStorage.setItem(SESSION_EXPIRATION_KEY, expiration.toString())
      localStorage.removeItem('sessionTime')
      localStorage.removeItem('sessionLastUpdate')
    }
  }

  if (!Number.isFinite(expiration) || expiration <= 0) return 0

  return Math.max(0, Math.ceil((expiration - Date.now()) / 1000))
}

export const claimSessionWarning = (level) => {
  const key = `${SESSION_WARNING_KEY_PREFIX}${level}`

  if (sessionStorage.getItem(key)) return false

  sessionStorage.setItem(key, 'true')
  return true
}

export const clearSession = () => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
  sessionStorage.clear()
}
