import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  base: '/cesium-examples-react/',
  build: {
    commonjsOptions: {
      // Ensure CommonJs modules are properly handled
      transformMixedEsModules: true,
    },
  },
})
