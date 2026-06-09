import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Pin PostCSS to this project so Vite doesn't walk up to a stray
  // ~/postcss.config.mjs (Tailwind) in the home directory.
  css: { postcss: {} },
})
