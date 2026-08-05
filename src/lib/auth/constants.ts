export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME || 'qts_session'
}
