import fs from 'fs';
import path from 'path';

const BASE_URL = "https://landing-api.rguktong.in";

const INSTITUTE_PAGES = [
    "aboutrgukt",
    "campuslife",
    "edusys",
    "govcouncil",
    "rtiinfo",
    "scst"
];

const DEPT_CODES = [
    "CSE", "CIVIL", "ECE", "EEE", "ME",
    "MATHEMATICS", "PHYSICS", "CHEMISTRY",
    "IT", "BIOLOGY", "ENGLISH", "LIB",
    "MANAGEMENT", "PED", "TELUGU", "YOGA"
];

const ACADEMIC_PAGES = [
    "AcademicPrograms",
    "AcademicCalender",
    "AcademicRegulations",
    "curicula"
];

const NOTIFICATION_TYPES = ["news_updates", "tenders", "careers"];

async function fetchJson(endpoint) {
    try {
        console.log(`  → ${endpoint}`);
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { accept: "application/json" }
        });
        if (!res.ok) {
            console.warn(`  ✗ ${res.status} for ${endpoint}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        return null;
    }
}

async function main() {
    console.log("🚀 Fetching all data from new API...\n");

    const data = {
        home: null,
        notifications: {},
        institute: {},
        departments: {},
        academics: {}
    };

    // 1. Home
    console.log("🏠 Home");
    data.home = await fetchJson("/api/home/");

    // 2. Notifications
    console.log("\n🔔 Notifications");
    for (const type of NOTIFICATION_TYPES) {
        data.notifications[type] = await fetchJson(`/api/notifications/?type=${type}`);
    }

    // 3. Institute
    console.log("\n🏛️  Institute");
    for (const page of INSTITUTE_PAGES) {
        data.institute[page] = await fetchJson(`/api/institute/${page}`);
    }

    // 4. Departments
    console.log("\n👨‍🏫 Departments");
    for (const dept of DEPT_CODES) {
        data.departments[dept] = await fetchJson(`/api/departments/${dept}`);
    }

    // 5. Academics
    console.log("\n🎓 Academics");
    for (const page of ACADEMIC_PAGES) {
        data.academics[page] = await fetchJson(`/api/academics/${page}`);
    }

    // Write output
    const tsContent = `// Auto-generated from ${BASE_URL}/docs — ${new Date().toISOString()}
// Do not edit manually. Re-run: node fetch-apis.mjs
export const apiData = ${JSON.stringify(data, null, 2)} as const;
`;

    const outDir = path.join(process.cwd(), "src", "data");
    const outPath = path.join(outDir, "apiData.ts");

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outPath, tsContent);
    console.log(`\n✅ Wrote all API data → ${outPath}`);
}

main().catch(err => {
    console.error(`\n❌ Fatal: ${err.message}`);
    process.exit(1);
});
