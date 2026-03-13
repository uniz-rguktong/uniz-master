// Convert all table JSON backups to CSV for Supabase import.
// Usage: node prisma/json-to-csv.js

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'backups', 'latest');
const outputDir = path.join(sourceDir, 'csv');

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toSupabaseDatetime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

function looksLikeDatetimeColumn(columnName) {
  return /(?:At|Date|Time)$/i.test(columnName);
}

function looksLikeIsoDateString(value) {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function escapeCsv(value, columnName) {
  if (value === null || value === undefined) return '';

  let str;
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    str = JSON.stringify(value);
  } else if (looksLikeDatetimeColumn(columnName) && looksLikeIsoDateString(value)) {
    str = toSupabaseDatetime(value);
  } else {
    str = String(value);
  }

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function toCsv(rows) {
  if (!rows.length) return '';

  const headerSet = new Set();
  for (const row of rows) {
    Object.keys(row).forEach((k) => headerSet.add(k));
  }

  const headers = Array.from(headerSet);
  const lines = [];

  lines.push(headers.map((h) => escapeCsv(h, h)).join(','));

  for (const row of rows) {
    const values = headers.map((h) => escapeCsv(row[h], h));
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

function run() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source folder not found: ${sourceDir}`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(sourceDir)
    .filter((f) => f.toLowerCase().endsWith('.json') && f !== '_summary.json');

  if (!files.length) {
    console.log('No JSON files found in latest backup folder.');
    return;
  }

  let converted = 0;

  for (const file of files) {
    const jsonPath = path.join(sourceDir, file);
    const csvPath = path.join(outputDir, `${path.basename(file, '.json')}.csv`);

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (error) {
      console.warn(`Skipping ${file}: invalid JSON (${error.message})`);
      continue;
    }

    if (!Array.isArray(parsed)) {
      console.warn(`Skipping ${file}: expected array of rows.`);
      continue;
    }

    const csv = toCsv(parsed);

    if (!csv) {
      fs.writeFileSync(csvPath, '', 'utf8');
      console.log(`Created empty CSV for ${file}`);
      converted += 1;
      continue;
    }

    fs.writeFileSync(csvPath, csv, 'utf8');
    console.log(`Converted ${file} -> ${path.basename(csvPath)} (${parsed.length} rows)`);
    converted += 1;
  }

  console.log(`\nDone. Created ${converted} CSV file(s) in: ${outputDir}`);
}

run();
