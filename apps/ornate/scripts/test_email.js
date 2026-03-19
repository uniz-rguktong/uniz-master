const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
require('dotenv').config();

// Load environment variables from the standard VPS path
// We could use dotenv but we will manually source from /root/uniz-secrets.env on the VPS instead.
// For now, let's trust the current process.env.
const region = process.env.ORNATE_AWS_REGION || process.env.AWS_REGION;
const accessKeyId = process.env.ORNATE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.ORNATE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const fromEmail = process.env.ORNATE_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || 'no-reply-ems@rguktong.in';

console.log('--- SES Connectivity Test ---');
console.log('Target Region: %s', region || 'NONE');
console.log('Access Key: %s', accessKeyId ? 'DEFINED' : 'MISSING');
console.log('Source Email: %s', fromEmail);
console.log('------------------------------');

if (!region || !accessKeyId || !secretAccessKey) {
    console.error('Error: Mandatory AWS credentials not found.');
    process.exit(1);
}

const client = new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
});

const targetEmail = 'o210193@rguktong.ac.in'; // Common testing email in this project

async function run() {
    console.log(`Sending a test transmission to: ${targetEmail}...`);
    try {
        const command = new SendEmailCommand({
            Source: `"Ornate Node Test" <${fromEmail}>`,
            Destination: { ToAddresses: [targetEmail] },
            Message: {
                Subject: { Data: 'Ornate VPS Connectivity OK', Charset: 'UTF-8' },
                Body: {
                    Text: { Data: 'Decoded transmission successful. VPS to AWS SES bridge verified.', Charset: 'UTF-8' },
                },
            },
        });

        const result = await client.send(command);
        console.log('SUCCESS! AWS Message ID: %s', result.MessageId);
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL FAILURE: %s', err.message);
        if (err.name === 'MessageRejected') {
            console.error('Possible Verification Issue: Check if the source or target email is verified in AWS SES Console (Sandbox mode).');
        }
        process.exit(1);
    }
}

run();
