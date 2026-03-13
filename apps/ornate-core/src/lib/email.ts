import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const FROM_EMAIL = () => process.env.SES_FROM_EMAIL!;

export interface EmailAttachment {
    filename: string;
    content: Buffer;
    cid?: string;
}

export interface EmailActionResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Build a raw MIME message with inline attachments (used for certificate emails with QR codes).
 */
function buildRawMimeMessage(
    from: string,
    to: string,
    subject: string,
    html: string,
    attachments: EmailAttachment[]
): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const relatedBoundary = `----=_Related_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const lines: string[] = [
        `From: "Ornate EMS" <${from}>`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
        '',
        `--${relatedBoundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(html).toString('base64').replace(/(.{76})/g, '$1\n'),
    ];

    for (const att of attachments) {
        const mimeType = att.filename.endsWith('.png') ? 'image/png' : 'application/octet-stream';
        lines.push(
            `--${relatedBoundary}`,
            `Content-Type: ${mimeType}; name="${att.filename}"`,
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: inline; filename="${att.filename}"`,
            ...(att.cid ? [`Content-ID: <${att.cid}>`] : []),
            '',
            att.content.toString('base64').replace(/(.{76})/g, '$1\n'),
        );
    }

    lines.push(`--${relatedBoundary}--`, `--${boundary}--`);
    return lines.join('\r\n');
}

export const sendCertificateEmail = async (
    to: string,
    subject: string,
    html: string,
    attachments: EmailAttachment[] = []
): Promise<EmailActionResponse> => {
    try {
        if (attachments.length > 0) {
            const rawMessage = buildRawMimeMessage(FROM_EMAIL(), to, subject, html, attachments);
            const command = new SendRawEmailCommand({
                RawMessage: { Data: new TextEncoder().encode(rawMessage) },
            });
            const result = await sesClient.send(command);
            console.log('Message sent: %s', result.MessageId);
            return { success: true, messageId: result.MessageId ?? '' };
        }

        // No attachments — use simple SendEmail
        const command = new SendEmailCommand({
            Source: `"Ornate EMS" <${FROM_EMAIL()}>`,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: { Html: { Data: html, Charset: 'UTF-8' } },
            },
        });
        const result = await sesClient.send(command);
        console.log('Message sent: %s', result.MessageId);
        return { success: true, messageId: result.MessageId ?? '' };
    } catch (error: any) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

export const getWinnerEmailTemplate = (
    name: string,
    eventName: string,
    rank: number,
    verifyUrl: string,
    certificateId: string
): string => {
    const rankText = rank === 1 ? '1st Prize' : rank === 2 ? '2nd Prize' : '3rd Prize';
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Congratulations, ${name}! 🎉</h2>
        <p style="color: #555;">
            We are thrilled to announce that you have won the <strong>${rankText}</strong> in <strong>${eventName}</strong>!
        </p>
        <p style="color: #555;">
            You can view and download your official certificate by clicking the button below. Your unique certificate verification code is provided as a QR code and text.
        </p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Certificate ID</p>
            <p style="margin: 5px 0 10px 0; color: #111827; font-family: monospace; font-size: 16px; font-weight: bold;">${certificateId}</p>
            <div style="margin-top: 15px;">
                <img src="cid:qrcode" alt="Verification QR Code" style="width: 150px; height: 150px; border: 1px solid #eee; border-radius: 4px;" />
            </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Certificate</a>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated message from Ornate EMS. Please do not reply directly to this email.
        </p>
    </div>
    `;
};

export const getParticipationEmailTemplate = (
    name: string,
    eventName: string,
    verifyUrl: string,
    certificateId: string
): string => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Hello ${name},</h2>
        <p style="color: #555;">
            Thank you for participating in <strong>${eventName}</strong>. We hope you had a great experience!
        </p>
        <p style="color: #555;">
            You can view and download your certificate of participation by clicking the button below. Your unique certificate verification code is provided as a QR code and text.
        </p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Certificate ID</p>
            <p style="margin: 5px 0 10px 0; color: #111827; font-family: monospace; font-size: 16px; font-weight: bold;">${certificateId}</p>
            <div style="margin-top: 15px;">
                 <img src="cid:qrcode" alt="Verification QR Code" style="width: 150px; height: 150px; border: 1px solid #eee; border-radius: 4px;" />
            </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Certificate</a>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated message from Ornate EMS. Please do not reply directly to this email.
        </p>
    </div>
    `;
};

export const getAnnouncementEmailTemplate = (
    title: string,
    content: string,
    category: string,
    author: string
): string => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
            <span style="font-size: 12px; font-weight: bold; color: #4b5563; text-transform: uppercase;">${category}</span>
        </div>
        <h2 style="color: #1a1a1a; margin-top: 0;">${title}</h2>
        <div style="color: #374151; line-height: 1.6; margin-bottom: 25px; white-space: pre-wrap;">
            ${content}
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <div style="font-size: 13px; color: #6b7280;">
            <p style="margin: 0;">Published by: <strong>${author}</strong></p>
            <p style="margin: 5px 0 0 0;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 30px; text-align: center;">
            This is an official notification from Ornate EMS.
        </p>
    </div>
    `;
};

export const getSportRegistrationEmailTemplate = (
    name: string,
    sportName: string,
    teamName: string,
    teamCode: string,
    members: { name: string; rollNumber: string; role?: string }[]
): string => {
    const memberRows = members.map(m => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">
                <div style="font-weight: bold;">${m.name}</div>
                <div style="font-size: 10px; color: #10B981; text-transform: uppercase; font-weight: bold;">${m.role || 'Member'}</div>
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #555; text-align: right; vertical-align: top; font-family: monospace;">${m.rollNumber}</td>
        </tr>
    `).join('');

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #10B981; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">Registration Confirmed!</h2>
        </div>
        <div style="padding: 20px;">
            <h3 style="color: #333;">Hello ${name},</h3>
            <p style="color: #555;">
                Your team registration for <strong>${sportName}</strong> has been successfully processed by the Branch Sports Administration.
            </p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Team Name</td>
                        <td style="color: #111827; font-weight: bold; text-align: right;">${teamName}</td>
                    </tr>
                    <tr>
                        <td style="color: #6b7280; font-size: 12px; text-transform: uppercase; padding-top: 8px;">Team Code</td>
                        <td style="color: #111827; font-family: monospace; font-weight: bold; text-align: right; padding-top: 8px;">${teamCode}</td>
                    </tr>
                </table>
            </div>

            <h4 style="color: #333; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; margin-top: 25px;">Team Roster</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Name</th>
                        <th style="text-align: right; padding: 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">ID</th>
                    </tr>
                </thead>
                <tbody>
                    ${memberRows}
                </tbody>
            </table>

            <p style="color: #555; margin-top: 25px;">
                Please keep this email for your records. Your team code will be required for participation and during matches.
            </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 0 0 6px 6px; text-align: center;">
            <p style="color: #888; font-size: 11px; margin: 0;">
                This is an automated receipt from Ornate EMS. If you have any questions, please contact your Branch Sports Coordinator.
            </p>
        </div>
    </div>
    `;
};

export const getIndividualSportRegistrationEmailTemplate = (
    name: string,
    sportName: string,
    studentId: string
): string => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #10B981; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">Registration Confirmed!</h2>
        </div>
        <div style="padding: 20px;">
            <h3 style="color: #333;">Hello ${name},</h3>
            <p style="color: #555;">
                Your individual registration for <strong>${sportName}</strong> has been successfully processed by the Branch Sports Administration.
            </p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Participant ID</td>
                        <td style="color: #111827; font-weight: bold; text-align: right;">${studentId}</td>
                    </tr>
                    <tr>
                        <td style="color: #6b7280; font-size: 12px; text-transform: uppercase; padding-top: 8px;">Competition</td>
                        <td style="color: #111827; font-weight: bold; text-align: right; padding-top: 8px;">${sportName}</td>
                    </tr>
                </table>
            </div>

            <p style="color: #555; margin-top: 25px;">
                Please keep this email for your records. You will need to present your Student ID during the event matches.
            </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 0 0 6px 6px; text-align: center;">
            <p style="color: #888; font-size: 11px; margin: 0;">
                This is an automated receipt from Ornate EMS. If you have any questions, please contact your Branch Sports Coordinator.
            </p>
        </div>
    </div>
    `;
};

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }): Promise<EmailActionResponse> => {
    try {
        const command = new SendEmailCommand({
            Source: `"Ornate EMS Updates" <${FROM_EMAIL()}>`,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: { Html: { Data: html, Charset: 'UTF-8' } },
            },
        });
        const result = await sesClient.send(command);
        return { success: true, messageId: result.MessageId ?? '' };
    } catch (error: any) {
        console.error('Email Send Error:', error);
        return { success: false, error: error.message };
    }
};

