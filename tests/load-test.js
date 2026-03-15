import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  // Thresholds: The test will fail if these conditions aren't met
  thresholds: {
    http_req_failed: ['rate<0.01'], // Errors must be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },

  // Stages: Ramping up to 5000 users
  stages: [
    { duration: '1m', target: 500 },  // Warm up to 500 users
    { duration: '2m', target: 2000 }, // Ramp up to 2000 users
    { duration: '3m', target: 2000 }, // Stay at 2000 users
    { duration: '1m', target: 0 },    // Cool down
  ],
};

export default function () {
  const url = 'https://uniz.rguktong.in';
  const signinUrl = 'https://uniz.rguktong.in/student/signin';
  
  // 1. Test Landing Page
  const res1 = http.get(url);
  check(res1, {
    'landing: status was 200': (r) => r.status === 200,
    'landing: duration was <= 500ms': (r) => r.timings.duration <= 500,
  });

  sleep(0.5);

  // 2. Test Sign-in Page
  const res2 = http.get(signinUrl);
  check(res2, {
    'signin: status was 200': (r) => r.status === 200,
    'signin: duration was <= 500ms': (r) => r.timings.duration <= 500,
  });

  // Pacing: wait 1 second between iterations
  sleep(1);
}
