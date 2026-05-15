import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardLoadDuration = new Trend('dashboard_load_duration');
const quoteGenerationDuration = new Trend('quote_generation_duration');
const calendarLoadDuration = new Trend('calendar_load_duration');
const aiResponseDuration = new Trend('ai_response_duration');
const pdfGenerationDuration = new Trend('pdf_generation_duration');
const dataSyncDuration = new Trend('data_sync_duration');

// Test configuration
export const _options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    errors: ['rate<0.1'], // Error rate should be less than 10%
    login_duration: ['p(95)<2000'], // 95% of login requests should be below 2s
    dashboard_load_duration: ['p(95)<3000'], // 95% of dashboard loads should be below 3s
    quote_generation_duration: ['p(95)<5000'], // 95% of quote generations should be below 5s
    calendar_load_duration: ['p(95)<2000'], // 95% of calendar loads should be below 2s
    ai_response_duration: ['p(95)<3000'], // 95% of AI responses should be below 3s
    pdf_generation_duration: ['p(95)<4000'], // 95% of PDF generations should be below 4s
    data_sync_duration: ['p(95)<2000'], // 95% of data syncs should be below 2s
  },
};

// Test data
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
};

// Helper function to get auth token
function getAuthToken() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  check(loginRes, {
    'login successful': r => r.status === 200,
  });

  return loginRes.json('token');
}

// Test scenarios
const loadTest = () => {
  // Login test
  const loginStart = new Date();
  const token = getAuthToken();
  loginDuration.add(new Date() - loginStart);

  // Set auth header
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Dashboard load test
  const dashboardStart = new Date();
  const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, { headers });
  dashboardLoadDuration.add(new Date() - dashboardStart);

  check(dashboardRes, {
    'dashboard loaded successfully': r => r.status === 200,
  });

  // Calendar load test
  const calendarStart = new Date();
  const calendarRes = http.get(`${BASE_URL}/api/calendar`, { headers });
  calendarLoadDuration.add(new Date() - calendarStart);

  check(calendarRes, {
    'calendar loaded successfully': r => r.status === 200,
  });

  // Quote generation test
  const quoteStart = new Date();
  const quoteRes = http.post(
    `${BASE_URL}/api/quotes/generate`,
    {
      service: 'consulting',
      area: 100,
      margin: 20,
    },
    { headers }
  );
  quoteGenerationDuration.add(new Date() - quoteStart);

  check(quoteRes, {
    'quote generated successfully': r => r.status === 200,
  });

  // PDF generation test
  const pdfStart = new Date();
  const pdfRes = http.post(`${BASE_URL}/api/quotes/${quoteRes.json('id')}/pdf`, {}, { headers });
  pdfGenerationDuration.add(new Date() - pdfStart);

  check(pdfRes, {
    'PDF generated successfully': r => r.status === 200,
  });

  // AI interaction test
  const aiStart = new Date();
  const aiRes = http.post(
    `${BASE_URL}/api/ai/chat`,
    {
      message: 'I need help with my budget',
      context: 'budget_planning',
    },
    { headers }
  );
  aiResponseDuration.add(new Date() - aiStart);

  check(aiRes, {
    'AI response received successfully': r => r.status === 200,
  });

  // Data sync test
  const syncStart = new Date();
  const syncRes = http.post(
    `${BASE_URL}/api/sync`,
    {
      lastSync: new Date(Date.now() - 3600000).toISOString(),
    },
    { headers }
  );
  dataSyncDuration.add(new Date() - syncStart);

  check(syncRes, {
    'Data sync completed successfully': r => r.status === 200,
  });

  // Error rate tracking
  errorRate.add(
    dashboardRes.status !== 200 ||
      calendarRes.status !== 200 ||
      quoteRes.status !== 200 ||
      pdfRes.status !== 200 ||
      aiRes.status !== 200 ||
      syncRes.status !== 200
  );

  // Sleep between iterations
  sleep(1);
};

export default loadTest;
