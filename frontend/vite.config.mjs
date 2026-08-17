import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,           // Disable in production — saves ~30-50% bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,     // Strip all console.log/warn/error from production build
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Split vendor libs into separate cacheable chunks
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion':  ['framer-motion'],
          'vendor-icons':   ['react-icons'],
          'vendor-firebase':['socket.io-client'],
          'vendor-ui':      ['react-hot-toast', 'canvas-confetti'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Raise warning threshold to 1MB
  },
});

