import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Game client runs on port 3000.
// Proxy /api/bgio/* → boardgame.io server at port 8000.
// Flask at port 5000 is called directly from LobbyAPI when needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // boardgame.io Lobby REST API calls
      '/api/bgio': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bgio/, ''),
      },
    },
  },
});
