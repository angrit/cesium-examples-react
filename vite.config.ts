import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  base: '/cesium-examples-react/',
  plugins: [react(), cesium({
    cesiumBuildRootPath: '/cesium-examples-react/cesium'
  })],
  build: {
    commonjsOptions: {
      // Ensure CommonJs modules are properly handled
      transformMixedEsModules: true,
    },
  },
})
