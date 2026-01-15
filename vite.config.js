import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: set base to '/<repo>/' for GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: '/crm-dashboard/',
})
