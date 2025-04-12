// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  aiApiUrl: 'http://localhost:3000/ai-api',
  useMockData: true, // Toggle for using mock data instead of real API calls
  defaultDurationPerQuestion: 30, // Default time in seconds for answering a question
  passThreshold: 90, // Percentage required to pass a module
  features: {
    darkMode: true,
    timedQuizzes: true,
    progressTracking: true
  },
  analytics: {
    enabled: false,
    trackingId: ''
  }
};