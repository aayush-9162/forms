import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The production build is served by Express under /report (single-server
// deploy), so assets and the router live under that base. Dev (`vite serve`)
// stays at the root so localhost:7802 works unchanged.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/report/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    // Bind to all interfaces so other devices on the LAN can connect.
    host: true,
    port: 7802,
    // Without this, Vite blocks requests whose Host header it doesn't
    // recognize (DNS-rebinding protection). Leading dot = wildcard match,
    // so any *.nip.io hostname works even if the laptop's IP changes.
    allowedHosts: ['.nip.io', '192.168.0.180'],
  },
}))
