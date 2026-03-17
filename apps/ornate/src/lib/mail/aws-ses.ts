import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

type WelcomeEmailInput = {
    to: string;
    name?: string | null;
    studentId?: string | null;
};

type EventRegistrationEmailInput = {
    to: string;
    name?: string | null;
    eventName: string;
    eventDate: Date;
    venue?: string | null;
    registrationStatus: 'PENDING' | 'CONFIRMED';
    amount: number;
    studentId?: string | null;
};

// Lazy client initialization to ensure env vars are loaded
let sesClient: SESClient | null = null;
function getSesClient() {
    if (!sesClient) {
        // Support both prefixed and non-prefixed env vars for flexibility between environments
        const region = process.env.ORNATE_AWS_REGION || process.env.AWS_REGION;
        const accessKeyId = process.env.ORNATE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.ORNATE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;


        if (!region || !accessKeyId || !secretAccessKey) {
            console.error('[mail] Missing AWS credentials for SES:', {
                region: !!region,
                accessKeyId: !!accessKeyId,
                secretAccessKey: !!secretAccessKey
            });
        }

        sesClient = new SESClient({
            region: region!,
            credentials: {
                accessKeyId: accessKeyId!,
                secretAccessKey: secretAccessKey!,
            },
        });
    }
    return sesClient;
}

const FROM_EMAIL = () => process.env.ORNATE_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || 'no-reply-ems@rguktong.in';

async function sendSesEmail(to: string, subject: string, html: string, text: string) {
    try {
        const client = getSesClient();
        const command = new SendEmailCommand({
            Source: `"Ornate Core" <${FROM_EMAIL()}>`,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: {
                    Html: { Data: html, Charset: 'UTF-8' },
                    // ornate-core SendEmailCommand pattern doesn't always include Text body
                },
            },
        });

        const result = await client.send(command);
        console.log('[mail] SES Email sent successfully:', result.MessageId);
        return true;
    } catch (error) {
        console.error('[mail] SES Email send error:', error);
        throw error;
    }
}

export async function sendWelcomeEmail(input: WelcomeEmailInput) {
    const displayName = (input.name || 'Student').trim();
    const idLine = input.studentId ? `Student ID: ${input.studentId}` : 'Account Verified';

    const subject = 'Your Journey Begins - Welcome to Ornate Fest';
    const text = `Hello ${displayName},\n\nWelcome to Ornate Fest portal. Your account has been created successfully.\n\n${input.studentId ? `Student ID: ${input.studentId}` : ''}\n\nTeam Ornate`;

    const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Welcome to the Mission</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #010105; font-family: Arial, sans-serif; color: #ffffff;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#010105">
        <tr>
            <td align="center" style="padding: 50px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #0a0a14; border: 1px solid #1e1e2d; border-radius: 24px; overflow: hidden;">
                    <tr>
                        <td height="4" bgcolor="#422164" style="background: linear-gradient(90deg, #422164 0%, #7c3aed 50%, #422164 100%);"></td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 45px 40px 10px 40px;">
                            <img src="https://ornate.rguktong.in/assets/Ornate_LOGO.jpg" alt="Logo" width="55" style="display: block; border-radius: 12px; background-color: #422164; padding: 10px;" />
                            <h2 style="margin: 20px 0 5px 0; font-size: 13px; font-weight: bold; color: #A3FF12; letter-spacing: 3px; text-transform: uppercase;">Mission Initiated</h2>
                            <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff;">Welcome, Agent.</h1>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 60px;">
                            <div style="height: 1px; width: 40px; background-color: #A3FF12; margin: 20px 0;"></div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 50px 30px 50px;">
                            <p style="margin: 0; font-size: 16px; color: #cbd5e1; line-height: 1.8; text-align: center;">
                                Hello <strong style="color: #ffffff;">${escapeHtml(displayName)}</strong>,<br/><br/>
                                Your credentials have been authorized. You are now officially part of <strong style="color: #ffffff;">Ornate '26</strong> — the grand technical fest of RGUKT Ongole.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 50px 40px 50px;">
                            <table border="0" cellpadding="0" cellspacing="0" style="background-color: #11111f; border: 1px dashed #422164; border-radius: 12px; padding: 20px 30px;">
                                <tr>
                                    <td align="center">
                                        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Identity Status</div>
                                        <div style="font-size: 18px; color: #ffffff; font-weight: bold;">${idLine}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 50px 50px 50px;">
                            <a href="https://ornate.rguktong.in" style="display: inline-block; padding: 16px 50px; background: linear-gradient(to right, #7c3aed, #422164); color: #ffffff; font-size: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 3px; border-radius: 50px; box-shadow: 0 15px 35px rgba(66, 33, 100, 0.4); border: 1px solid #5b21b6;">Enter Hub</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #1e1e2d; border-top: 1px solid #422164;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6; text-align: center;">
                                <strong style="color: #ffffff;">Security Alert:</strong> Keep your login credentials confidential. If you did not create this account, please contact our security team.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 50px 40px; background-color: #0a0a14;">
                            <div style="font-size: 15px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">TEAM ORNATE '26</div>
                            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Rajiv Gandhi University of Knowledge Technologies, Ongole</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return sendSesEmail(input.to, subject, html, text);
}

export async function sendEventRegistrationEmail(input: EventRegistrationEmailInput) {
    const displayName = (input.name || 'Student').trim();
    const statusText = input.registrationStatus === 'CONFIRMED' ? 'Confirmed' : 'Pending Payment';
    const eventDateText = formatDate(input.eventDate);
    const amountText = input.amount > 0 ? `Rs. ${input.amount}` : 'Free';

    const lines = [
        `Hello ${displayName},`,
        '',
        `You have successfully registered for: ${input.eventName}`,
        `Status: ${statusText}`,
        `Date: ${eventDateText}`,
        input.venue ? `Venue: ${input.venue}` : '',
        `Fee: ${amountText}`,
        input.studentId ? `Student ID: ${input.studentId}` : '',
        '',
        'Team Ornate',
    ].filter(Boolean);

    const subject = `Event Registration: ${input.eventName}`;
    const text = lines.join('\n');
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;">
        <h2 style="margin-bottom:8px;">Event Registration Successful</h2>
        <p>Hello ${escapeHtml(displayName)},</p>
        <p>You have successfully registered for <strong>${escapeHtml(input.eventName)}</strong>.</p>
        <p><strong>Status:</strong> ${escapeHtml(statusText)}</p>
        <p><strong>Date:</strong> ${escapeHtml(eventDateText)}</p>
        ${input.venue ? `<p><strong>Venue:</strong> ${escapeHtml(input.venue)}</p>` : ''}
        <p><strong>Fee:</strong> ${escapeHtml(amountText)}</p>
        ${input.studentId ? `<p><strong>Student ID:</strong> ${escapeHtml(input.studentId)}</p>` : ''}
        <p style="margin-top:20px;">Team Ornate</p>
      </div>
    `;

    return sendSesEmail(input.to, subject, html, text);
}

export async function sendOTPEmail(to: string, otp: string) {
    const subject = `${otp} is your verification code for Ornate`;
    const text = `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nTeam Ornate`;
    const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Ornate Hub: Secure Verification</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .otp-display { font-size: 36px !important; letter-spacing: 8px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #010105; font-family: Arial, sans-serif; color: #ffffff;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#010105">
        <tr>
            <td align="center" style="padding: 50px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #0a0a14; border: 1px solid #1e1e2d; border-radius: 24px; overflow: hidden;">
                    <tr>
                        <td height="4" bgcolor="#422164" style="background: linear-gradient(90deg, #422164 0%, #7c3aed 50%, #422164 100%);"></td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 45px 40px 30px 40px;">
                            <img src="https://ornate.rguktong.in/assets/Ornate_LOGO.jpg" alt="Logo" width="55" style="display: block; border-radius: 12px; background-color: #422164; padding: 10px;" />
                            <h2 style="margin: 20px 0 5px 0; font-size: 13px; font-weight: bold; color: #A3FF12; letter-spacing: 3px; text-transform: uppercase;">Identity Verification</h2>
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">Unlock Access</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 50px 20px 50px;">
                            <p style="margin: 0; font-size: 16px; color: #94a3b8; line-height: 1.8; text-align: center;">
                                To finalize your transmission and enter the <strong style="color: #ffffff;">Ornate '26</strong> digital sphere, use the decryption key below.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 50px 40px 50px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="background-color: #000000; padding: 35px; border-radius: 20px; border: 1px solid #422164;">
                                        <div style="font-family: monospace; font-size: 11px; color: #64748b; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px;">Verification Key</div>
                                        <div class="otp-display" style="font-family: monospace; font-size: 44px; font-weight: bold; color: #ffffff; letter-spacing: 12px;">
                                            ${otp}
                                        </div>
                                        <div style="margin-top: 10px; font-size: 11px; color: #ef4444; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Valid for the next 10 minutes only</div>
                                        <div style="margin-top: 20px; height: 2px; width: 60px; background-color: #A3FF12; border-radius: 2px;"></div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 50px 40px 50px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #11111f; border-radius: 12px; padding: 15px 25px;">
                                <tr>
                                    <td align="left">
                                        <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Status</div>
                                        <div style="font-size: 13px; color: #A3FF12; font-weight: bold;">ACTIVE_SIGNAL</div>
                                    </td>
                                    <td align="center" style="border-left: 1px solid #1e1e2d; border-right: 1px solid #1e1e2d;">
                                        <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Expiring In</div>
                                        <div style="font-size: 13px; color: #ffffff; font-weight: bold;">10 Minutes</div>
                                    </td>
                                    <td align="right">
                                        <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Origin</div>
                                        <div style="font-size: 13px; color: #ffffff; font-weight: bold;">RGUKT_ONG</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #1e1e2d; border-top: 1px solid #422164;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6; text-align: center;">
                                <strong style="color: #ffffff;">Shield Protocol:</strong> Do not share this decryption key. Ornate Hub agents will never initiate a request for this code via external channels.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 50px 40px; background-color: #0a0a14;">
                            <div style="font-size: 15px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">TEAM ORNATE '26</div>
                            <p style="margin: 8px 0 25px 0; font-size: 12px; color: #64748b;">Rajiv Gandhi University of Knowledge Technologies, Ongole</p>
                            <a href="https://ornate.rguktong.in" style="display: inline-block; padding: 16px 50px; background: linear-gradient(to right, #7c3aed, #422164); color: #ffffff; font-size: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 3px; border-radius: 50px; box-shadow: 0 15px 35px rgba(66, 33, 100, 0.4); border: 1px solid #5b21b6;">Enter Hub</a>
                        </td>
                    </tr>
                </table>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin-top: 30px;">
                    <tr>
                        <td align="center" style="color: #475569; font-size: 10px; font-family: monospace; opacity: 0.6;">
                            TRANSACTION_UUID: ${Math.random().toString(36).substring(2).toUpperCase()}<br/>
                            RGUKT-ONG_SECURE_MAIL_RELAY_2026
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
    return sendSesEmail(to, subject, html, text);
}

function formatDate(value: Date) {
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    }).format(value);
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
