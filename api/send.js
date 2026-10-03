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

function header(req, name) {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

/** Decode optional base64 payload (x-html-b64 / x-text-b64). */
function decodeMaybeB64(raw, b64) {
  if (typeof b64 === 'string' && b64) {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  return typeof raw === 'string' ? raw : undefined;
}

function readFields(req) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Headers first; body as fallback
  const to = header(req, 'x-to') ?? body.to;
  const subject = header(req, 'x-subject') ?? body.subject;
  const html = decodeMaybeB64(header(req, 'x-html') ?? body.html, header(req, 'x-html-b64'));
  const text = decodeMaybeB64(header(req, 'x-text') ?? body.text, header(req, 'x-text-b64'));

  return { to, subject, html, text };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!secretIsValid(header(req, 'x-api-secret'))) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { to, subject, html, text } = readFields(req);

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
