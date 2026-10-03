import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function secretIsValid(received) {
  const expected = process.env.MAIL_API_SECRET || '';
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  if (!secretIsValid(req.headers['x-api-secret'])) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { to, subject, html, text } = req.body || {};

  if (!isEmail(to) || typeof subject !== 'string' || !subject || typeof html !== 'string' || !html) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'AfriNumber'}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text: typeof text === 'string' ? text : undefined,
    });
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('send_failed', err.message);
    return res.status(500).json({ error: 'send_failed' });
  }
}
