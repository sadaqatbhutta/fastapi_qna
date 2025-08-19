import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5173
      // If you want a proxy during dev, uncomment and adjust:
      // proxy: {
      //   '/api': {
      //     target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
      //     changeOrigin: true,
      //     rewrite: (p) => p.replace(/^\/api/, '')
      //   }
      // }
    }
  }
})