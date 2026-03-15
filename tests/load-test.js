import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  // Thresholds: The test will fail if these conditions aren't met
  thresholds: {
    http_req_failed: ['rate<0.01'], // Errors must be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },

  // Stages: Ramping up to 1000 users
  stages: [
    { duration: '1m', target: 200 },  // Warm up
    { duration: '2m', target: 1000 }, // Ramp to 1k
    { duration: '3m', target: 1000 }, // Stay at 1k
    { duration: '1m', target: 0 },    // Cool down
  ],
};

export default function () {
  const vpsIp = 'https://76.13.241.174:31234';
  const params = {
    headers: {
      'Host': 'uniz.rguktong.in',
    },
    insecureSkipTLSVerify: true,
  };
  
  // 1. Test Landing Page
  const res1 = http.get(`${vpsIp}/`, params);
  check(res1, {
    'landing: status was 200': (r) => r.status === 200,
    'landing: duration was <= 500ms': (r) => r.timings.duration <= 500,
  });

  sleep(0.5);

  // 2. Test Sign-in Page
  const res2 = http.get(`${vpsIp}/student/signin`, params);
  check(res2, {
    'signin: status was 200': (r) => r.status === 200,
    'signin: duration was <= 500ms': (r) => r.timings.duration <= 500,
  });

  // Pacing: wait 1 second between iterations
  sleep(1);
}
