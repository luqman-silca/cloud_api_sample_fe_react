import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteVConsole } from 'vite-plugin-vconsole'

export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    viteVConsole({
      entry: path.resolve(__dirname, 'src/main.tsx'),
      enabled: command === 'serve', // Enable in dev mode
      config: {
        maxLogNumber: 1000,
        theme: 'light'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  envDir: './env',
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";',
      },
    },
  },
  build: {
    target: 'es2015',
    sourcemap: true,
  },
}))
