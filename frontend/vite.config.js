import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Bind to all interfaces so other devices on the LAN can connect.
    host: true,
    port: 7801,
    // Without this, Vite blocks requests whose Host header it doesn't
    // recognize (DNS-rebinding protection). Leading dot = wildcard match,
    // so any *.nip.io hostname works even if the laptop's IP changes.
    allowedHosts: ['.nip.io', '192.168.0.180'],
  },
})
