import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige /api/* al backend Express
      '/api': 'http://localhost:3000'
    }
  }
})
