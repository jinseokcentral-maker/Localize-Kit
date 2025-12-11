import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8000/docs-json', // sign up at app.heyapi.dev
  output: 'app/api',
  plugins: ['@hey-api/client-ky','zod','@tanstack/react-query'], 
});