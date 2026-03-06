import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error("R2 environment variables are missing");
    }
}

export const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT || '',
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});
