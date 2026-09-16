import react from '@vitejs/plugin-react'
import { cwd } from 'node:process'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
  }
})
