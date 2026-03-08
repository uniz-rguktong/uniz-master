import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const ses = new SESv2Client({
    region: process.env.AWS_SES_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const FROM_ADDRESS = process.env.SES_FROM_EMAIL || 'noreply@ornate.space';

async function sendEmail(to: string, subject: string, html: string) {
    const command = new SendEmailCommand({
        FromEmailAddress: `ORNATE MISSION CONTROL <${FROM_ADDRESS}>`,
        Destination: { ToAddresses: [to] },
        Content: {
            Simple: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: { Html: { Data: html, Charset: 'UTF-8' } },
            },
        },
    });
    await ses.send(command);
}

/**
 * Sends a premium "Welcome to the Crew" email to a newly registered user.
 */
export async function sendWelcomeEmail(email: string, name: string, studentId: string) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
                
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #050505;
                    font-family: 'JetBrains Mono', monospace;
                    color: #ffffff;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background: #000000;
                    border: 1px solid #A3FF12;
                    padding: 40px;
                    border-radius: 4px;
                    box-shadow: 0 0 30px rgba(163, 255, 18, 0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 1px solid rgba(163, 255, 18, 0.2);
                    padding-bottom: 25px;
                    margin-bottom: 35px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: 0.3em;
                    color: #A3FF12;
                    text-transform: uppercase;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    background: rgba(163, 255, 18, 0.1);
                    color: #A3FF12;
                    font-size: 10px;
                    font-weight: bold;
                    letter-spacing: 0.2em;
                    border: 1px solid rgba(163, 255, 18, 0.3);
                    margin-top: 15px;
                }
                h1 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #ffffff;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                p {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.6;
                }
                .mission-brief {
                    background: rgba(163, 255, 18, 0.03);
                    border-left: 3px solid #A3FF12;
                    padding: 20px;
                    margin: 30px 0;
                }
                .label {
                    color: #A3FF12;
                    font-weight: bold;
                    font-size: 11px;
                    display: block;
                    margin-bottom: 5px;
                    letter-spacing: 1px;
                }
                .value {
                    font-size: 16px;
                    color: #ffffff;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 25px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.3);
                    text-align: center;
                    letter-spacing: 1px;
                }
                .cta {
                    display: block;
                    width: fit-content;
                    margin: 40px auto 0;
                    padding: 16px 32px;
                    background-color: transparent;
                    border: 1px solid #A3FF12;
                    color: #A3FF12;
                    text-decoration: none;
                    text-transform: uppercase;
                    font-weight: bold;
                    letter-spacing: 2px;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">ORNATE 2026</div>
                    <div class="status-badge">MISSION ID: ${studentId}</div>
                </div>
                
                <h1>Access Granted, Cadet.</h1>
                
                <p>Welcome to the expedition, <strong>${name}</strong>.</p>
                <p>Your identification has been verified and your clearance is now <strong>Level Alpha</strong>. You are officially part of the Ornate Expeditionary Force.</p>
                
                <div class="mission-brief">
                    <span class="label">DEBRIEFING:</span>
                    <p style="margin: 0;">We are rewriting the history of RGUKT. You have been assigned to help us witness the gallons of zeal and secure the future of our culture and innovation.</p>
                </div>
                
                <p>Prepare for warp. Your mission starts now.</p>
                
                <a href="${process.env.NEXTAUTH_URL}" class="cta">ENTER MISSION CONTROL</a>
                
                <div class="footer">
                    COPYRIGHT &copy; 2026 ORNATE EXPEDITIONARY FORCE<br>
                    RGUKT ONGOLE · SECURE CHANNEL ALPHA-7
                </div>
            </div>
        </body>
        </html>
        `;

    try {
        await sendEmail(email, '🚀 ACCESS GRANTED: Welcome to the Ornate Expeditionary Force', html);
        console.log(`[EMAIL] Welcome email sent successfully to ${email}`);
    } catch (error) {
        console.error('[EMAIL] Failed to send welcome email:', error);
        // We don't throw the error because we don't want to break the registration flow
    }
}

/**
 * Sends a high-security OTP verification code to a user.
 */
export async function sendOTPEmail(email: string, otp: string) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
                
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #050505;
                    font-family: 'JetBrains Mono', monospace;
                    color: #ffffff;
                }
                .container {
                    max-width: 500px;
                    margin: 40px auto;
                    background: #000000;
                    border: 1px solid #A3FF12;
                    padding: 40px;
                    border-radius: 4px;
                    box-shadow: 0 0 30px rgba(163, 255, 18, 0.1);
                    text-align: center;
                }
                .logo {
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: 0.3em;
                    color: #A3FF12;
                    text-transform: uppercase;
                    margin-bottom: 30px;
                }
                .otp-box {
                    background: rgba(163, 255, 18, 0.05);
                    border: 1px dashed #A3FF12;
                    padding: 30px;
                    margin: 30px 0;
                }
                .otp-code {
                    font-size: 42px;
                    font-weight: 800;
                    letter-spacing: 0.2em;
                    color: #ffffff;
                    margin: 0;
                }
                .label {
                    color: #A3FF12;
                    font-weight: bold;
                    font-size: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                    display: block;
                }
                p {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                    line-height: 1.6;
                }
                .warning {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.3);
                    margin-top: 30px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">ORNATE 2026</div>
                
                <p>A secure access request was initiated. Use the following code to verify your identity:</p>
                
                <div class="otp-box">
                    <span class="label">Verification Code</span>
                    <h2 class="otp-code">${otp}</h2>
                </div>
                
                <p>This code is valid for <strong>10 minutes</strong>. Do not share this with anyone, including mission staff.</p>
                
                <div class="warning">
                    If you did not request this code, please ignore this transmission.<br>
                    RGUKT ONGOLE · MISSION CONTROL
                </div>
            </div>
        </body>
        </html>
        `;

    try {
        await sendEmail(email, '🔐 SECURE ACCESS: Your Verification Code', html);
        console.log(`[OTP] Verification email sent to ${email}`);
    } catch (error) {
        console.error('[OTP] Failed to send verification email:', error);
        throw new Error("Failed to send verification email. Please try again.");
    }
}
