import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// This allows us to use different configurations based on the environment
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Base configuration that applies to all environments
  const config = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
  
  // Development-specific configuration
  if (mode === 'development') {
    return {
      ...config,
      server: {
        port: 5173,
        proxy: {
          '/api': {
            target: 'http://localhost:5050',
            changeOrigin: true,
          },
        },
      },
      preview: {
        port: 5173,
        proxy: {
          '/api': {
            target: 'http://localhost:5050',
            changeOrigin: true,
          },
        },
      },
    };
  }
  
  // Production-specific configuration
  return config;
});