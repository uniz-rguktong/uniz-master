import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. Load student IDs from the generated JSON
const students = new SharedArray('student data', function () {
    return JSON.parse(open('./students.json'));
});

export const options = {
    stages: [
        { duration: '30s', target: 200 }, // Ramp to 200 students
        { duration: '1m', target: 813 },  // Peak load: All 813 students in O21 batch
        { duration: '3m', target: 813 },  // Hold peak to test sustained PDF generation
        { duration: '30s', target: 0 },   // Cool down
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'], // Max 5% failure rate
        http_req_duration: ['p(95)<3000'], // 95% of requests must be < 3s (PDFs take time)
    },
};

const BASE_URL = 'https://api.uniz.rguktong.in/api/v1';
const CAPTCHA_BYPASS = 'uniz_dev_bypass_token_2026';
const SEMESTER_ID = 'E3-SEM-1';

export default function () {
    // Pick student sequentially per VU to avoid colliding too much if needed, 
    // or just use VU index to pick from the 813 pool.
    const studentId = students[__VU % students.length];
    const password = `${studentId}@rguktong`; // StudentID@rguktong

    const headers = { 'Content-Type': 'application/json' };

    // --- 1. SIGN IN ---
    let loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        username: studentId,
        password: password,
        captchaToken: CAPTCHA_BYPASS
    }), { headers });

    const loginSuccess = check(loginRes, {
        'login status 200': (r) => r.status === 200,
        'has auth token': (r) => r.json('token') !== undefined,
    });

    if (!loginSuccess) {
        console.error(`[AUTH_FAIL] Student: ${studentId}, Status: ${loginRes.status}, Body: ${loginRes.body}`);
        sleep(1);
        return;
    }

    const token = loginRes.json('token');
    const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Simulate "loading" time after login
    sleep(1);

    // --- 2. GET PROFILE (/me) ---
    let profileRes = http.get(`${BASE_URL}/profile/student/me`, { headers: authHeaders });
    const profileSuccess = check(profileRes, {
        'profile fetch success': (r) => r.status === 200,
    });

    if (!profileSuccess) {
        console.error(`[PROFILE_FAIL] Student: ${studentId}, Status: ${profileRes.status}`);
    }

    sleep(0.5);

    // --- 3. GET GRADES METADATA ---
    let gradesRes = http.get(`${BASE_URL}/academics/grades?studentId=${studentId}&semester=SEM-1&year=E3`, { headers: authHeaders });
    check(gradesRes, {
        'grades view success': (r) => r.status === 200,
    });

    sleep(0.5);

    // --- 4. GET ATTENDANCE METADATA ---
    let attendanceRes = http.get(`${BASE_URL}/academics/attendance?studentId=${studentId}&semester=SEM-1&year=E3`, { headers: authHeaders });
    check(attendanceRes, {
        'attendance view success': (r) => r.status === 200,
    });

    sleep(1);

    // --- 5. DOWNLOAD GRADES PDF ---
    let downloadGradesRes = http.get(`${BASE_URL}/academics/grades/download/${SEMESTER_ID}?studentId=${studentId}`, { headers: authHeaders });
    check(downloadGradesRes, {
        'grades pdf download': (r) => r.status === 200,
        'is pdf': (r) => r.headers['Content-Type'] === 'application/pdf',
    });

    sleep(1);

    // --- 6. DOWNLOAD ATTENDANCE PDF ---
    let downloadAttendanceRes = http.get(`${BASE_URL}/academics/attendance/download/${SEMESTER_ID}?studentId=${studentId}`, { headers: authHeaders });
    check(downloadAttendanceRes, {
        'attendance pdf download': (r) => r.status === 200,
        'is pdf': (r) => r.headers['Content-Type'] === 'application/pdf',
    });

    // Student "pacing" - how long they stay on the site
    sleep(Math.random() * 5 + 5);
}
