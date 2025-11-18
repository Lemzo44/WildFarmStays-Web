import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    include: "**/*.{jsx,tsx,js,ts}",
  })],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native/Libraries/Utilities/codegenNativeComponent': 'react-native-web/Libraries/Utilities/codegenNativeComponent',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react-native-web'],
    exclude: ['react-native-safe-area-context'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'react-native-vendor': ['react-native-web'],
        },
      },
    },
  },
})
