import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const nodeModuleChunk = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  const normalized = id.replace(/\\/g, '/');

  if (normalized.includes('/react/') || normalized.includes('/react-dom/') || normalized.includes('/scheduler/')) return 'vendor-react';
  if (normalized.includes('/react-router') || normalized.includes('/@remix-run/')) return 'vendor-router';
  if (normalized.includes('/@tanstack/react-query') || normalized.includes('/@tanstack/query')) return 'vendor-query';
  if (normalized.includes('/motion/')) return 'vendor-motion';
  if (normalized.includes('/lucide-react/')) return 'vendor-icons';
  if (normalized.includes('/recharts/') || normalized.includes('/d3-')) return 'vendor-charts';
  if (normalized.includes('/maplibre-gl/')) return undefined;
  if (normalized.includes('/html2canvas/')) return 'vendor-html2canvas';
  if (normalized.includes('/jspdf/') || normalized.includes('/jspdf-autotable/')) return 'vendor-jspdf';
  if (normalized.includes('/@google/genai/') || normalized.includes('/protobufjs/')) return 'vendor-ai';
  if (normalized.includes('/zod/') || normalized.includes('/react-hook-form/') || normalized.includes('/@hookform/')) return 'vendor-forms';
  if (normalized.includes('/@base-ui/') || normalized.includes('/vaul/') || normalized.includes('/sonner/') || normalized.includes('/next-themes/')) return undefined;

  return undefined;
};

export default defineConfig(({command}) => {
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@app': path.resolve(__dirname, './src/app'),
        '@processes': path.resolve(__dirname, './src/processes'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@widgets': path.resolve(__dirname, './src/widgets'),
        '@features': path.resolve(__dirname, './src/features'),
        '@entities': path.resolve(__dirname, './src/entities'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    esbuild: {
      jsxDev: false,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            return nodeModuleChunk(id);
          },
        },
      },
    },
  };
});
