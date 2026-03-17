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
        sesClient = new SESClient({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }
    return sesClient;
}

const FROM_EMAIL = () => process.env.SES_FROM_EMAIL!;

async function sendSesEmail(to: string, subject: string, html: string, text: string) {
    try {
        const client = getSesClient();
        const command = new SendEmailCommand({
            Source: `"Ornate EMS" <${FROM_EMAIL()}>`,
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
    const idLine = input.studentId ? `Student ID: ${input.studentId}` : '';

    const subject = 'Welcome to Ornate Fest';
    const text = [
        `Hello ${displayName},`,
        '',
        'Welcome to Ornate Fest portal. Your account has been created successfully.',
        idLine,
        '',
        'You can now login and register for events.',
        '',
        'Team Ornate',
    ].filter(Boolean).join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;">
        <h2 style="margin-bottom:8px;">Welcome to Ornate Fest</h2>
        <p>Hello ${escapeHtml(displayName)},</p>
        <p>Your account has been created successfully.</p>
        ${idLine ? `<p><strong>${escapeHtml(idLine)}</strong></p>` : ''}
        <p>You can now login and register for events.</p>
        <p style="margin-top:20px;">Team Ornate</p>
      </div>
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
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;">
        <h2 style="margin-bottom:8px;">Email Verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#A3FF12;background:#000;padding:12px;text-align:center;">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
        <p style="margin-top:20px;">Team Ornate</p>
      </div>
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
