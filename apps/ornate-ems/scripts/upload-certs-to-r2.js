const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME ||
  !R2_PUBLIC_DOMAIN
) {
  console.error("❌ Missing R2 environment variables.");
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

const filesToUpload = [
  {
    localPath: "public/certificates/themes/gold_bg.png",
    key: "certificates/themes/gold_bg.png",
    contentType: "image/png",
  },
  {
    localPath: "public/certificates/themes/silver_bg.jpeg",
    key: "certificates/themes/silver_bg.jpeg",
    contentType: "image/jpeg",
  },
  {
    localPath: "public/certificates/themes/bronze_bg.jpeg",
    key: "certificates/themes/bronze_bg.jpeg",
    contentType: "image/jpeg",
  },
  {
    localPath: "public/certificates/themes/participation_bg.png",
    key: "certificates/themes/participation_bg.png",
    contentType: "image/png",
  },
];

async function uploadFiles() {
  console.log(`🚀 Starting upload to R2 Bucket: ${R2_BUCKET_NAME}`);

  for (const file of filesToUpload) {
    try {
      const filePath = path.join(process.cwd(), file.localPath);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath);
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: file.key,
        Body: fileContent,
        ContentType: file.contentType,
      });

      await s3Client.send(command);
      const publicUrl = `${R2_PUBLIC_DOMAIN}/${file.key}`;
      console.log(`✅ Uploaded: ${file.localPath} -> ${publicUrl}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file.localPath}:`, error);
    }
  }

  console.log("\n🎉 All uploads complete!");
}

uploadFiles();
