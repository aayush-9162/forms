import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVER_DIR = path.join(__dirname, '..')
const TOKEN_PATH = path.join(SERVER_DIR, '.drive-token.json')
// Full Drive scope is needed so the uploader can write PDFs into folders
// that were shared with it by someone else. The narrower `drive.file` scope
// only grants access to files the app created itself and will return
// "File not found" for pre-existing shared folders.
const SCOPES = ['https://www.googleapis.com/auth/drive']

function locateClientSecret() {
  const files = fs.readdirSync(SERVER_DIR)
  const match = files.find(
    (f) => f.startsWith('client_secret') && f.endsWith('.json')
  )
  return match ? path.join(SERVER_DIR, match) : null
}

let oauth2Client = null
let driveClient = null
let configCache = null

function readClientConfig() {
  if (configCache) return configCache
  const clientSecretPath = locateClientSecret()
  if (!clientSecretPath) {
    throw new Error(
      'No client_secret*.json file found in server/. Download the OAuth client JSON from Google Cloud Console and drop it in server/.'
    )
  }
  const raw = fs.readFileSync(clientSecretPath, 'utf8')
  const creds = JSON.parse(raw)
  const config = creds.installed || creds.web
  if (!config) {
    throw new Error(
      'Invalid client_secret JSON — expected an "installed" or "web" key.'
    )
  }
  configCache = config
  return config
}

function getOAuthClient() {
  if (oauth2Client) return oauth2Client
  const config = readClientConfig()
  oauth2Client = new google.auth.OAuth2(
    config.client_id,
    config.client_secret,
    config.redirect_uris?.[0] || 'urn:ietf:wg:oauth:2.0:oob'
  )
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
      oauth2Client.setCredentials(token)
    } catch (err) {
      console.warn('[drive] Failed to load existing token:', err.message)
    }
  }
  // Persist refreshed tokens back to disk so the server survives restarts.
  oauth2Client.on('tokens', (tokens) => {
    try {
      const existing = fs.existsSync(TOKEN_PATH)
        ? JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
        : {}
      const merged = { ...existing, ...tokens }
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2))
    } catch (err) {
      console.warn('[drive] Could not persist refreshed token:', err.message)
    }
  })
  return oauth2Client
}

export function getAuthUrl() {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function exchangeCodeForToken(code) {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))
  client.setCredentials(tokens)
  return tokens
}

export function isDriveConfigured() {
  try {
    return !!locateClientSecret() && fs.existsSync(TOKEN_PATH)
  } catch {
    return false
  }
}

export function getDriveClient() {
  if (driveClient) return driveClient
  driveClient = google.drive({ version: 'v3', auth: getOAuthClient() })
  return driveClient
}

export async function uploadBufferToDrive({
  filename,
  mimeType,
  buffer,
  folderId,
}) {
  if (!isDriveConfigured()) {
    throw new Error('Drive not configured — run `npm run drive:setup`')
  }
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, name, webViewLink, parents',
    supportsAllDrives: true,
  })
  return res.data
}

export async function deleteDriveFile(fileId) {
  if (!fileId) return
  const drive = getDriveClient()
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  })
}

export async function inspectFolder(folderId) {
  const drive = getDriveClient()
  const res = await drive.files.get({
    fileId: folderId,
    fields:
      'id, name, mimeType, driveId, capabilities(canAddChildren,canEdit), owners(emailAddress)',
    supportsAllDrives: true,
  })
  return res.data
}
