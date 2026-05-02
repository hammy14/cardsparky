import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Rebuild trigger: 2026-05-02 - Set VITE_API_URL=https://api.cardsparky.com in Vercel
export default defineConfig({
  plugins: [react()],
});
