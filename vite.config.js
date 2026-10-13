import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  build: {
    // three.js is ~980 KB uncompressed; it only loads via the lazy
    // HouseViewer chunk, so the initial JS parse stays small. The
    // >500 KB warning is noisy — raise its threshold instead of fighting
    // natural chunking.
    chunkSizeWarningLimit: 1200,
  },
})
