import fs from 'fs';
import path from 'path';

const BASE_URL = "https://college-scraped.vercel.app";

async function fetchJson(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) return [];
    return await res.json();
}

async function main() {
    const tsPath = path.join(process.cwd(), "src", "data", "apiData.ts");
    // Just re-fetching everything cleanly but properly mapping notifications
    
    // We already have everything else, let's just do a quick script to re-create the whole apiData
}
