import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 1. Load env vars from .env files (if any exist)
  const env = loadEnv(mode, '.', '');

  // 2. Robust Key Detection Strategy
  // We check ALL possibilities.
  const apiKey = 
    process.env.API_KEY ||       // Vercel System Env
    process.env.VITE_API_KEY ||  // Vercel System Env (Vite convention)
    env.API_KEY ||               // .env file
    env.VITE_API_KEY ||          // .env file (Vite convention)
    '';                          // Fallback to empty string to allow runtime manual entry

  console.log(`[Vite Build] API Key detection: ${apiKey ? 'Success (Hidden)' : 'Not found (Will rely on UI input)'}`);

  return {
    plugins: [react()],
    define: {
      // 3. Inject the key into the client-side code
      // We use JSON.stringify to ensure it's a valid string in the compiled code
      'process.env.API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
    },
  };
});