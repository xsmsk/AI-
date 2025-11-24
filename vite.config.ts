import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 1. Load env vars from .env files (if any exist)
  const env = loadEnv(mode, '.', '');

  // 2. Robust Key Detection Strategy
  // Vercel injects variables into `process.env`.
  // Vite `loadEnv` handles .env files.
  // We check ALL possibilities to ensure we catch the key.
  const apiKey = 
    process.env.API_KEY ||       // Vercel System Env
    process.env.VITE_API_KEY ||  // Vercel System Env (Vite convention)
    env.API_KEY ||               // .env file
    env.VITE_API_KEY;            // .env file (Vite convention)

  console.log(`[Vite Build] API Key detection: ${apiKey ? 'Success (Hidden)' : 'Failed'}`);

  return {
    plugins: [react()],
    define: {
      // 3. Inject the key into the client-side code
      // We polyfill 'process.env.API_KEY' so the service code works as expected
      'process.env.API_KEY': JSON.stringify(apiKey),
      
      // We also expose it via the standard Vite method just in case
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
    },
  };
});