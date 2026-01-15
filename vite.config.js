import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: set base to '/<repo>/' for GitHub Pages.
// You can also edit it later after repo is created.
export default defineConfig({
  plugins: [react()],
  base: './',
})
