import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');

// Q70 = visually identical to ~Q78 for animation frames (humans can't notice diff at this quality on fast-moving frames)
// Effort 6 = maximum compression ratio
const WEBP_QUALITY = 70;
const WEBP_EFFORT = 6;

async function compressWebP(filePath) {
    const originalSize = fs.statSync(filePath).size;

    try {
        // Read the file into memory first — avoids Windows file-lock conflict
        // when Sharp reads and we write back to the same path
        const inputBuf = fs.readFileSync(filePath);

        const buf = await sharp(inputBuf)
            .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, lossless: false })
            .toBuffer();

        const newSize = buf.length;

        if (newSize < originalSize) {
            fs.writeFileSync(filePath, buf);
            return { savedBytes: originalSize - newSize, originalBytes: originalSize };
        } else {
            return { savedBytes: 0, originalBytes: originalSize };
        }
    } catch (err) {
        throw err;
    }
}

async function processFolder(folderPath, folderName) {
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.webp'));
    let totalSavedBytes = 0;
    let totalOriginalBytes = 0;
    let processed = 0;

    process.stdout.write(`\n📁 ${folderName} (${files.length} files):`);

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const result = await compressWebP(filePath);
        totalSavedBytes += result.savedBytes;
        totalOriginalBytes += result.originalBytes;
        processed++;

        if (processed % 20 === 0 || processed === files.length) {
            process.stdout.write(` ${processed}/${files.length}...`);
        }
    }

    const savedMB = (totalSavedBytes / 1024 / 1024).toFixed(2);
    const origMB = (totalOriginalBytes / 1024 / 1024).toFixed(2);
    const pct = totalOriginalBytes > 0 ? ((totalSavedBytes / totalOriginalBytes) * 100).toFixed(1) : 0;
    console.log(`\n   ✅ ${origMB} MB → ${(origMB - savedMB).toFixed(2)} MB | Saved: ${savedMB} MB (${pct}%)`);
    return { savedBytes: totalSavedBytes, originalBytes: totalOriginalBytes };
}

async function main() {
    console.log('🗜️  WebP Compression — Quality 70 (High Quality, Smaller Files)');
    console.log(`   Settings: Q${WEBP_QUALITY} | Effort ${WEBP_EFFORT}/6 | Lossy`);
    console.log('─'.repeat(55));

    const folders = fs.readdirSync(ASSETS_DIR).filter(f =>
        fs.statSync(path.join(ASSETS_DIR, f)).isDirectory()
    );

    let grandSavedBytes = 0;
    let grandOriginalBytes = 0;

    for (const folder of folders) {
        const folderPath = path.join(ASSETS_DIR, folder);
        const result = await processFolder(folderPath, folder);
        grandSavedBytes += result.savedBytes;
        grandOriginalBytes += result.originalBytes;
    }

    const beforeMB = (grandOriginalBytes / 1024 / 1024).toFixed(2);
    const savedMB = (grandSavedBytes / 1024 / 1024).toFixed(2);
    const afterMB = ((grandOriginalBytes - grandSavedBytes) / 1024 / 1024).toFixed(2);
    const totalPct = ((grandSavedBytes / grandOriginalBytes) * 100).toFixed(1);

    console.log('\n' + '═'.repeat(55));
    console.log(`✨ COMPRESSION COMPLETE`);
    console.log(`   Before  : ${beforeMB} MB`);
    console.log(`   After   : ${afterMB} MB`);
    console.log(`   Saved   : ${savedMB} MB (${totalPct}% reduction)`);
    console.log('═'.repeat(55));
}

main().catch(console.error);
