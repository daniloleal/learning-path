// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.angularquiz.com/api',
  aiApiUrl: 'https://api.angularquiz.com/ai-api',
  useMockData: false, // Always use real API in production
  defaultDurationPerQuestion: 30,
  passThreshold: 90,
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