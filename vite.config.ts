import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/PromQLPrettify/', // GitHub Pages 部署路径
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue']
          }
        }
      }
  },
  server: {
    port: 3000,
    open: true
  }
})