// PM2 config for the single Forms server (API + both built web apps).
//
// Deploy on the VM:
//   git pull
//   cd server && npm install            # picks up google-auth-library etc.
//   npm run build:web                   # builds frontend/ and formreport/
//   pm2 start ecosystem.config.cjs      # first time
//   pm2 restart forms-server            # subsequent deploys
//   pm2 save                            # persist across reboots (already done)
module.exports = {
  apps: [
    {
      name: 'forms-server',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
