import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// During development, any request to /api is forwarded to the Node server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
