import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  server: { port: 5179, open: true, proxy: { '/api': 'http://localhost:8001' } }
})
