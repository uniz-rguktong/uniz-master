import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');

// Sample first file from each scene and test different quality levels
async function analyzeFile(filePath) {
    const stats = fs.statSync(filePath);
    const originalSizeKB = (stats.size / 1024).toFixed(1);
    const meta = await sharp(filePath).metadata();

    console.log(`\nFile: ${path.basename(filePath)}`);
    console.log(`  Original: ${originalSizeKB} KB | ${meta.width}x${meta.height} | ${meta.format}`);

    // Try different quality levels
    for (const q of [70, 75, 80, 85, 90]) {
        const buf = await sharp(filePath).webp({ quality: q, effort: 6 }).toBuffer();
        const newKB = (buf.length / 1024).toFixed(1);
        const diff = (((buf.length - stats.size) / stats.size) * 100).toFixed(1);
        const sign = diff > 0 ? '+' : '';
        console.log(`  Q${q}: ${newKB} KB (${sign}${diff}%)`);
    }
}

async function main() {
    console.log('🔍 Analyzing WebP compression characteristics...\n');

    const folders = fs.readdirSync(ASSETS_DIR).filter(f =>
        fs.statSync(path.join(ASSETS_DIR, f)).isDirectory()
    );

    for (const folder of folders) {
        const folderPath = path.join(ASSETS_DIR, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.webp'));
        // Sample middle frame
        const sampleFile = path.join(folderPath, files[60] || files[0]);
        console.log(`\n📁 Scene: ${folder}`);
        await analyzeFile(sampleFile);
    }
}

main().catch(console.error);
