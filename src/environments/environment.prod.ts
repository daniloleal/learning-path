// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.angularquiz.com/api',
  aiApiUrl: 'https://api.angularquiz.com/ai-api',
  useMockData: false, // Always use real API in production
  defaultDurationPerQuestion: 30,
  passThreshold: 90,
  openai: {
    apiKey: '', // API key should be injected at build time or retrieved securely
    model: 'gpt-4-turbo',
    useMockData: false
  },
  features: {
    darkMode: true,
    timedQuizzes: true,
    progressTracking: true
  },
  analytics: {
    enabled: true,
    trackingId: 'G-XXXXXXXXXX' // Replace with actual tracking ID
  }
};