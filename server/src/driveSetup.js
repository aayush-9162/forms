import http from 'node:http'
import url from 'node:url'
import 'dotenv/config'
import { getAuthUrl, exchangeCodeForToken } from './drive.js'

// Must match one of the redirect_uris in your client_secret*.json.
// Yours is configured for http://localhost:3000/auth/google/callback.
const PORT = 3000
const CALLBACK_PATH = '/auth/google/callback'

function renderPage(status, heading, body) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${heading}</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; text-align: center;">
  <h1 style="color: ${status === 'ok' ? '#16a34a' : '#dc2626'};">${heading}</h1>
  <p style="color: #475569; line-height: 1.6;">${body}</p>
</body></html>`
}

async function main() {
  let authUrl
  try {
    authUrl = getAuthUrl()
  } catch (err) {
    console.error('Setup failed:', err.message)
    process.exit(1)
  }

  const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url || '', true)
    if (!parsed.pathname?.startsWith(CALLBACK_PATH)) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end(renderPage('err', 'Not found', `Expected ${CALLBACK_PATH}`))
      return
    }

    const { code, error: errParam } = parsed.query
    if (errParam) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(renderPage('err', 'Authorization denied', String(errParam)))
      console.error('\n✗ Authorization denied:', errParam)
      server.close(() => process.exit(1))
      return
    }
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(renderPage('err', 'Missing code', 'No ?code= in the callback.'))
      return
    }

    try {
      await exchangeCodeForToken(String(code))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(
        renderPage(
          'ok',
          '✓ Connected',
          'Drive authorization complete. You can close this tab and return to the terminal.'
        )
      )
      console.log('\n✓ Token saved to server/.drive-token.json')
      console.log('  The server can now upload PDF reports to Drive.')
      server.close(() => process.exit(0))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' })
      res.end(renderPage('err', 'Exchange failed', err.message))
      console.error('\n✗ Failed to exchange code:', err.message)
      server.close(() => process.exit(1))
    }
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n✗ Port ${PORT} is already in use. Stop whatever's bound to it (often another Node app) and re-run \`npm run drive:setup\`.`
      )
    } else {
      console.error('\n✗ Server error:', err.message)
    }
    process.exit(1)
  })

  server.listen(PORT, () => {
    console.log('\n======================================================')
    console.log('  Google Drive one-time authorization')
    console.log('======================================================\n')
    console.log(
      `Listening for Google's callback on http://localhost:${PORT}${CALLBACK_PATH}\n`
    )
    console.log(
      '1. Open this URL in the browser of the Google account that has'
    )
    console.log('   EDIT access to DRIVE_100 / DRIVE_200:\n')
    console.log('   ' + authUrl + '\n')
    console.log('2. Sign in and click Allow on the Drive permission.')
    console.log('3. The redirect will land here and finish automatically.')
    console.log('   (You do NOT need to paste anything back.)\n')
  })
}

main()
