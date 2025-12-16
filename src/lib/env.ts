const isDev = process.env.NODE_ENV === 'development';

export const env = {
  API_BASE_URL: isDev
    ? 'http://localhost:8000'
    : 'https://hexa-ai-server-production.up.railway.app',
  FRONTEND_URL: isDev
    ? 'http://localhost:3000'
    : 'https://hexa-frontend-chi.vercel.app',
} as const;