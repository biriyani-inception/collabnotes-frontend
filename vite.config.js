import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // sockjs-client expects a Node-style `global`.
  define: { global: 'globalThis' },
});
