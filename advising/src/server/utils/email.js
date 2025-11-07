// server/email.js
import nodemailer from "nodemailer";

const MAIL_ENABLED = String(process.env.MAIL_ENABLED || "false") === "true";

let transporter = null;
if (MAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends an email if MAIL_ENABLED=true (no-op otherwise).
 * @param {string|string[]} to
 * @param {string} subject
 * @param {string} text
 * @param {string} [html]
 */
export const sendEmail = async (to, subject, text, html) => {
  if (!MAIL_ENABLED) {
    console.log(`[mail] Skipped (MAIL_ENABLED=false). To=${to} Subject="${subject}"`);
    return { skipped: true };
  }
  if (!transporter) throw new Error("Mail transporter not initialized");

  const mailOptions = {
    from: process.env.SMTP_FROM || "no-reply@example.com",
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[mail] Sent to ${to}: ${info.messageId}`);
    return { sent: true, id: info.messageId };
  } catch (err) {
    console.error("[mail] Error:", err);
    throw err;
  }
};
