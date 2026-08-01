import { OAuth2Client } from 'google-auth-library'
import 'dotenv/config'

// Single point of identity for the API. Verifies a Google-issued ID token
// (JWT) on every request using google-auth-library, which fetches and caches
// Google's public certs and checks signature, expiry, issuer, and audience.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

// Optional: only accept accounts on this email domain (e.g. 123cfc.com).
// Leave empty to accept any valid Google account.
const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || '')
  .trim()
  .toLowerCase()

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    '[auth] GOOGLE_CLIENT_ID is not set — every request will be rejected. ' +
      'Set it in server/.env to the same value as the frontend VITE_GOOGLE_CLIENT_ID.'
  )
}
console.log(
  `[auth] verifying Google ID tokens for client ${GOOGLE_CLIENT_ID || '(unset)'}` +
    (ALLOWED_EMAIL_DOMAIN ? `, restricted to @${ALLOWED_EMAIL_DOMAIN}` : '')
)

const client = new OAuth2Client(GOOGLE_CLIENT_ID)

// The route files import this under its historical name (`requireGoogleAuth`).
// It is once again exactly what the name says: require a valid Google user.
export async function requireGoogleAuth(req, res, next) {
  return requireAuth(req, res, next)
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization header' })
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    // Google sets email_verified=false for some accounts; require a verified
    // email so we never attribute a submission to an unowned address.
    if (!payload.email || payload.email_verified === false) {
      return res.status(401).json({ error: 'Email not verified with Google' })
    }

    // Domain restriction. `hd` (hosted domain) is the trustworthy signal for
    // Workspace accounts; fall back to the email suffix for the rest.
    if (ALLOWED_EMAIL_DOMAIN) {
      const emailDomain = payload.email.split('@')[1]?.toLowerCase()
      const ok =
        payload.hd?.toLowerCase() === ALLOWED_EMAIL_DOMAIN ||
        emailDomain === ALLOWED_EMAIL_DOMAIN
      if (!ok) {
        return res
          .status(403)
          .json({ error: `Access limited to @${ALLOWED_EMAIL_DOMAIN} accounts` })
      }
    }

    req.user = {
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || null,
      sub: payload.sub,
    }
    next()
  } catch (err) {
    console.warn('[auth] rejected token:', err.message)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
