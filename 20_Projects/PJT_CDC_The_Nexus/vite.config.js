import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'axios', 'discord.js'],
          'charts': ['cytoscape'],
          'components': ['./src/components/']
        },
      }
    }
  },
})

// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."
// "Exists in the Moment, Vanishes in Time."