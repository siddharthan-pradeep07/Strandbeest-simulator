import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages custom-domain hosting should use the root base.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
