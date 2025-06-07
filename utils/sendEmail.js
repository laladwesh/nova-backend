// utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, html, from = process.env.EMAIL_FROM }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({ from, to, subject, html });
  console.log(`→ Email sent to ${to} with subject "${subject}"`);
}

module.exports = sendEmail;
