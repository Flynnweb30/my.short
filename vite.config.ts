import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Disable WebSocket HMR to prevent "WebSocket closed without opened" errors in sandbox
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
