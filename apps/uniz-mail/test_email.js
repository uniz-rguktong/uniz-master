const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "noreplycampusschield@gmail.com",
    pass: "acix rfbi kujh xwtj",
  },
});

async function main() {
  try {
    console.log("Attempting to send email...");
    const info = await transporter.sendMail({
      from: '"UniZ Security" <noreplycampusschield@gmail.com>',
      to: "o210008@rguktong.ac.in", // Sending to self to test
      subject: "Test Email Verification",
      text: "This is a test email to verify credentials.",
    });
    console.log("Message sent successfully: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

main();
