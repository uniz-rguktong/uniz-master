// Convert registrations.json → registrations.csv for Supabase direct import
// Run with: node prisma/convert-registrations-csv.js

const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, 'backups', 'latest');
const inputPath = path.join(backupDir, 'registrations.json');
const outputPath = path.join(backupDir, 'registrations.csv');

const registrations = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// CSV columns matching the Registration table exactly
const columns = [
    'id', 'eventId', 'userId', 'studentName', 'studentId',
    'status', 'paymentStatus', 'amount', 'transactionId', 'screenshotUrl',
    'createdAt', 'certificateIssuedAt', 'certificateType', 'certificateUrl',
    'rank', 'email', 'phone', 'branch', 'year', 'section'
];

function formatDatetime(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

const datetimeColumns = new Set(['createdAt', 'certificateIssuedAt']);

function escapeCsv(val, col) {
    if (val === null || val === undefined) return '';
    if (datetimeColumns.has(col)) return formatDatetime(val);
    const str = String(val);
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

const header = columns.join(',');
const rows = registrations.map(reg => {
    return columns.map(col => escapeCsv(reg[col], col)).join(',');
});

const csv = header + '\n' + rows.join('\n') + '\n';
fs.writeFileSync(outputPath, csv, 'utf-8');

console.log(`Converted ${registrations.length} registrations to CSV`);
console.log(`Output: ${outputPath}`);
console.log(`\nColumns: ${columns.join(', ')}`);
console.log('\nImport this CSV into the "Registration" table in Supabase Table Editor.');
