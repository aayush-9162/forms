import 'dotenv/config'
import { isDriveConfigured, inspectFolder } from './drive.js'

async function main() {
  if (!isDriveConfigured()) {
    console.error(
      '✗ Drive not configured. Put client_secret*.json in server/ and run `npm run drive:setup`.'
    )
    process.exit(1)
  }

  const targets = [
    { env: 'DRIVE_100', label: 'Arden cash PDFs' },
    { env: 'DRIVE_200', label: 'Waynesville cash PDFs' },
    { env: 'IMAGES', label: 'All form image/file attachments' },
  ]

  let allGood = true
  for (const { env, label } of targets) {
    const folderId = (process.env[env] || '').trim()
    console.log('\n──────────────────────────────────────────────')
    console.log(`${env}  (${label})`)
    console.log(`  folder id: ${folderId || '(missing in .env)'}`)
    if (!folderId) {
      allGood = false
      continue
    }
    try {
      const info = await inspectFolder(folderId)
      const canAdd = info.capabilities?.canAddChildren
      console.log(`  name:           ${info.name}`)
      console.log(`  mimeType:       ${info.mimeType}`)
      console.log(
        `  driveId:        ${info.driveId || '(My Drive — not a Shared Drive)'}`
      )
      console.log(
        `  canAddChildren: ${canAdd === true ? '✓ yes — uploads will work' : '✗ NO — your account cannot add files here'}`
      )
      if (info.owners?.length) {
        console.log(`  owner:          ${info.owners[0].emailAddress}`)
      }
      if (!canAdd) allGood = false
    } catch (err) {
      allGood = false
      const apiErr = err?.response?.data?.error
      console.log(`  ✗ API error: ${apiErr?.message || err.message}`)
      if (apiErr?.code === 404) {
        console.log(
          '    → Your authorized account cannot see this folder. Make sure the'
        )
        console.log(
          '      folder is shared with the Google account you authorized during'
        )
        console.log('      `npm run drive:setup`.')
      }
    }
  }

  console.log('\n──────────────────────────────────────────────')
  if (allGood) {
    console.log('✓ Both folders are writable by the authorized account.')
    process.exit(0)
  } else {
    console.log(
      '✗ One or more folders is not writable. Typical fixes:'
    )
    console.log(
      '  • Ask the folder owner to upgrade your account from Viewer to Editor'
    )
    console.log('    (or Contributor on a Shared Drive).')
    console.log(
      '  • If it is a Shared Drive, confirm the account is a member.'
    )
    console.log(
      '  • Re-run `npm run drive:setup` if you want to authorize a different account.'
    )
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
