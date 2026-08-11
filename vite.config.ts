import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // PDF/export heavy libs — only loaded on demand
          'vendor-pdf': ['jspdf', 'html2canvas'],
          // Spreadsheet export
          'vendor-xlsx': ['xlsx'],
          // Charts — lazy loaded by Analytics
          'vendor-recharts': ['recharts'],
          // Firebase SDK
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
          ],
          // Animation library
          'vendor-framer': ['framer-motion'],
        },
      },
    },
    // Raise warning threshold slightly — we knowingly split big deps
    chunkSizeWarningLimit: 600,
  },
});
