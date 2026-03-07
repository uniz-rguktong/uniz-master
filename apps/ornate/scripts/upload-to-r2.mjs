import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mime from "mime-types";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
    console.error("Missing R2 configuration in .env");
    process.exit(1);
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

const assetsDir = path.resolve(__dirname, "../public/assets");

async function uploadFile(filePath, relativePath) {
    const fileStream = fs.createReadStream(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    // Create a folder in the cloud by prefixing the key
    // We'll put everything under 'landing-assets/' to satisfy "create a folder for us"
    const key = `landing-assets/${relativePath.replace(/\\/g, "/")}`;

    console.log(`Uploading ${relativePath} as ${key} (${contentType})...`);

    try {
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: fileStream,
                ContentType: contentType,
            },
            queueSize: 4,
            partSize: 1024 * 1024 * 5, // 5MB
            leavePartsOnError: false,
        });

        await parallelUploads3.done();
        console.log(`Successfully uploaded ${relativePath}`);
    } catch (e) {
        console.error(`Error uploading ${relativePath}:`, e);
    }
}

async function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            await walkDir(filePath, callback);
        } else {
            const relativePath = path.relative(assetsDir, filePath);
            await callback(filePath, relativePath);
        }
    }
}

async function main() {
    console.log("Starting asset upload to R2...");
    await walkDir(assetsDir, async (filePath, relativePath) => {
        await uploadFile(filePath, relativePath);
    });
    console.log("Upload complete!");
}

main().catch(console.error);
