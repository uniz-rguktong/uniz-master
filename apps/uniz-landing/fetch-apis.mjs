import fs from 'fs';
import path from 'path';

const BASE_URL = "https://college-scraped.vercel.app";

const institutePages = [
    "aboutrgukt",
    "campuslife",
    "edusys",
    "govcouncil",
    "rtiinfo",
    "scst"
];

const deptCodes = [
    "CSE",
    "CIVIL",
    "ECE",
    "EEE",
    "ME",
    "MATHEMATICS",
    "PHYSICS",
    "CHEMISTRY",
    "IT",
    "BIOLOGY",
    "ENGLISH",
    "LIB",
    "MANAGEMENT",
    "PED",
    "TELUGU",
    "YOGA"
];

const academicsPages = [
    "academic-calendar",
    "academic-regulations",
    "curriculum",
    "examination-branch",
    "library"
];

async function fetchJson(endpoint) {
    try {
        console.log(`Fetching ${endpoint}...`);
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { accept: "application/json" }
        });
        if (!res.ok) {
            console.warn(`Warn: Failed to fetch ${endpoint} - ${res.status}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        return null;
    }
}

async function main() {
    const data = {
        home: null,
        notifications: {
            news_updates: null,
            tenders: null,
            careers: null
        },
        institute: {},
        departments: {},
        academics: {}
    };

    // Global
    data.home = await fetchJson("/api/home");
    data.notifications.news_updates = await fetchJson("/api/notifications?type=news_updates");
    data.notifications.tenders = await fetchJson("/api/notifications?type=tenders");
    data.notifications.careers = await fetchJson("/api/notifications?type=careers");

    // Institute
    for (const page of institutePages) {
        data.institute[page] = await fetchJson(`/api/institute/${page}`);
    }

    // Departments
    for (const dept of deptCodes) {
        data.departments[dept] = await fetchJson(`/api/departments/${dept}`);
    }

    // Academics 
    for (const page of academicsPages) {
        const res = await fetchJson(`/api/academics/${page}`);
        if (res !== null) {
            data.academics[page] = res;
        }
    }

    const tsContent = `// Automatically generated from scraping API
export const apiData = ${JSON.stringify(data, null, 2)} as const;
`;

    const outPath = path.join(process.cwd(), "src", "data", "apiData.ts");

    if (!fs.existsSync(path.dirname(outPath))) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
    }

    fs.writeFileSync(outPath, tsContent);
    console.log(`Successfully wrote all API data to ${outPath}`);
}

main();
