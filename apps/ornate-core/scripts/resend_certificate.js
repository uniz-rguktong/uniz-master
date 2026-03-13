const { PrismaClient } = require('@prisma/client');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');
const prisma = new PrismaClient();

// SES configuration
const sesClient = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const FROM_EMAIL = process.env.SES_FROM_EMAIL;

// QR Code generation
const QRCode = require('qrcode');

async function generateQRCodeBuffer(url) {
    try {
        return await QRCode.toBuffer(url, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 300,
            margin: 1,
        });
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
}

function getWinnerEmailTemplate(name, eventName, rank, verifyUrl, certificateId) {
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
}

async function resendCertificate() {
    const email = 'bhuchiki12@gmail.com';

    console.log(`\n📧 Attempting to resend certificate to: ${email}\n`);

    // Find the user and their registration
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            registrations: {
                include: {
                    event: true
                }
            }
        }
    });

    if (!user) {
        console.log(`❌ User not found: ${email}`);
        return;
    }

    console.log(`✅ User found: ${user.name}`);

    // Find the registration with a certificate
    const regWithCert = user.registrations.find(r => r.certificateUrl && r.status === 'ATTENDED');

    if (!regWithCert) {
        console.log(`❌ No certificate found for this user`);
        return;
    }

    console.log(`✅ Certificate found for event: ${regWithCert.event.title}`);
    console.log(`   Registration ID: ${regWithCert.id}`);
    console.log(`   Rank: ${regWithCert.rank}`);
    console.log(`   Certificate Type: ${regWithCert.certificateType}`);

    // Generate verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify/${regWithCert.id}`;

    console.log(`\n🔗 Verification URL: ${verificationUrl}`);

    // Generate QR Code
    console.log(`\n📱 Generating QR code...`);
    const qrCodeBuffer = await generateQRCodeBuffer(verificationUrl);

    let attachments = [];
    if (qrCodeBuffer) {
        attachments.push({
            filename: 'qrcode.png',
            content: qrCodeBuffer,
            cid: 'qrcode'
        });
        console.log(`✅ QR code generated`);
    } else {
        console.log(`⚠️  QR code generation failed, sending without QR`);
    }

    // Generate email HTML
    const emailHtml = getWinnerEmailTemplate(
        regWithCert.studentName,
        regWithCert.event.title,
        regWithCert.rank,
        verificationUrl,
        regWithCert.id
    );

    // Send email via SES Raw (supports inline attachments)
    console.log(`\n📤 Sending email to: ${email}...`);

    try {
        const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const relatedBoundary = `----=_Related_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const subject = `Certificate of Achievement: ${regWithCert.event.title}`;

        const lines = [
            `From: "Ornate EMS" <${FROM_EMAIL}>`,
            `To: ${email}`,
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
            Buffer.from(emailHtml).toString('base64').replace(/(.{76})/g, '$1\n'),
        ];

        for (const att of attachments) {
            lines.push(
                `--${relatedBoundary}`,
                `Content-Type: image/png; name="${att.filename}"`,
                'Content-Transfer-Encoding: base64',
                `Content-Disposition: inline; filename="${att.filename}"`,
                ...(att.cid ? [`Content-ID: <${att.cid}>`] : []),
                '',
                att.content.toString('base64').replace(/(.{76})/g, '$1\n'),
            );
        }

        lines.push(`--${relatedBoundary}--`, `--${boundary}--`);
        const rawMessage = lines.join('\r\n');

        const command = new SendRawEmailCommand({
            RawMessage: { Data: new TextEncoder().encode(rawMessage) },
        });
        const result = await sesClient.send(command);

        console.log(`\n✅ EMAIL SENT SUCCESSFULLY!`);
        console.log(`   Message ID: ${result.MessageId}`);

    } catch (error) {
        console.error(`\n❌ FAILED TO SEND EMAIL:`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Full error:`, error);
    }
}

resendCertificate()
    .catch((e) => {
        console.error('Script error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
