import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend } from 'k6/metrics';

// Custom metrics for granular reporting
const landingDuration = new Trend('step_landing_page_duration');
const signinPageDuration = new Trend('step_signin_page_duration');
const authDuration = new Trend('step_auth_api_duration');
const metadataDuration = new Trend('step_metadata_fetch_duration');
const pdfDuration = new Trend('step_pdf_render_duration');

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
const SEMESTER_ID = 'E1-SEM-1';

export default function () {
    const studentId = students[__VU % students.length];
    let password = `${studentId}@rguktong`; 
    if (studentId === "O210329") {
        password = "12345678";
    }

    const headers = { 'Content-Type': 'application/json' };

    // --- 0. INITIAL PAGE LOADS ---
    let landingRes = http.get('https://uniz.rguktong.in', { tags: { step: 'landing' } });
    landingDuration.add(landingRes.timings.duration);
    check(landingRes, {
        'landing page status 200': (r) => r.status === 200,
        'landing page < 500ms': (r) => r.timings.duration < 500,
    });

    let signinPageRes = http.get('https://uniz.rguktong.in/student/signin', { tags: { step: 'signin_page' } });
    signinPageDuration.add(signinPageRes.timings.duration);
    check(signinPageRes, {
        'signin page status 200': (r) => r.status === 200,
        'signin page < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.5);

    // --- 1. SIGN IN ---
    let loginRes = http.post(`${BASE_URL}/auth/login/student`, JSON.stringify({
        username: studentId,
        password: password,
        captchaToken: CAPTCHA_BYPASS
    }), { headers, tags: { step: 'auth_api' } });
    authDuration.add(loginRes.timings.duration);

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
    let gradesRes = http.get(`${BASE_URL}/academics/grades?studentId=${studentId}&semester=SEM-1&year=E1`, { headers: authHeaders, tags: { step: 'metadata' } });
    metadataDuration.add(gradesRes.timings.duration);
    check(gradesRes, {
        'grades view success': (r) => r.status === 200,
        'metadata < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.5);

    // --- 4. GET ATTENDANCE METADATA ---
    let attendanceRes = http.get(`${BASE_URL}/academics/attendance?studentId=${studentId}&semester=SEM-1&year=E1`, { headers: authHeaders, tags: { step: 'metadata' } });
    metadataDuration.add(attendanceRes.timings.duration);
    check(attendanceRes, {
        'attendance view success': (r) => r.status === 200,
    });

    sleep(1);

    // --- 5. DOWNLOAD GRADES PDF ---
    let downloadGradesRes = http.get(`${BASE_URL}/academics/grades/download/${SEMESTER_ID}?studentId=${studentId}`, { headers: authHeaders, tags: { step: 'pdf' } });
    pdfDuration.add(downloadGradesRes.timings.duration);
    check(downloadGradesRes, {
        'grades pdf download': (r) => r.status === 200,
        'is pdf': (r) => r.headers['Content-Type'] === 'application/pdf',
        'pdf < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);

    // --- 6. DOWNLOAD ATTENDANCE PDF ---
    let downloadAttendanceRes = http.get(`${BASE_URL}/academics/attendance/download/${SEMESTER_ID}?studentId=${studentId}`, { headers: authHeaders, tags: { step: 'pdf' } });
    pdfDuration.add(downloadAttendanceRes.timings.duration);
    check(downloadAttendanceRes, {
        'attendance pdf download': (r) => r.status === 200,
        'is pdf': (r) => r.headers['Content-Type'] === 'application/pdf',
    });

    sleep(Math.random() * 5 + 5);
}
