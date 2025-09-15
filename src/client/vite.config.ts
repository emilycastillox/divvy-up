import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    root: '.',
    publicDir: 'public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/styles': path.resolve(__dirname, './src/styles'),
        '@/config': path.resolve(__dirname, './src/config'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    define: {
      // Make environment variables available to the client
      'import.meta.env.VITE_NODE_ENV': JSON.stringify(
        env.VITE_NODE_ENV || 'development'
      ),
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || 'http://localhost:3001/api'
      ),
      'import.meta.env.VITE_CLIENT_URL': JSON.stringify(
        env.VITE_CLIENT_URL || 'http://localhost:3000'
      ),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(
        env.VITE_APP_NAME || 'DivvyUp'
      ),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(
        env.VITE_APP_VERSION || '1.0.0'
      ),
      'import.meta.env.VITE_ENABLE_DEBUG': JSON.stringify(
        env.VITE_ENABLE_DEBUG || 'false'
      ),
      'import.meta.env.VITE_PAYMENT_PROVIDER': JSON.stringify(
        env.VITE_PAYMENT_PROVIDER || 'none'
      ),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
        env.VITE_STRIPE_PUBLISHABLE_KEY || ''
      ),
      'import.meta.env.VITE_VENMO_CLIENT_ID': JSON.stringify(
        env.VITE_VENMO_CLIENT_ID || ''
      ),
      'import.meta.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify(
        env.VITE_PAYPAL_CLIENT_ID || ''
      ),
    },
  };
});
