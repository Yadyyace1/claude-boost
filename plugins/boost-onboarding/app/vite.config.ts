import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O app é servido pelo scripts/assistente.mjs (mesma origem dos dados), então os caminhos são relativos.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@motor': path.resolve(__dirname, '../assistente'),
    },
  },
  server: {
    proxy: {
      '/dados': 'http://127.0.0.1:47330',
      '/ambiente.json': 'http://127.0.0.1:47330',
      '/respostas.json': 'http://127.0.0.1:47330',
      '/confirmar': 'http://127.0.0.1:47330',
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
