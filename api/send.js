import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

const host = process.env.MAIL_HOST || 'smtp.gmail.com';
const port = Number(process.env.MAIL_PORT || 465);
const encryption = (process.env.MAIL_ENCRYPTION || '').toLowerCase();
const secure = port === 465 || encryption === 'ssl';
const user = process.env.MAIL_USERNAME || process.env.GMAIL_USER;
const pass = process.env.MAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD;
const fromAddress = process.env.MAIL_FROM_ADDRESS || user;
const fromName = process.env.MAIL_FROM_NAME || 'AfriNumber';

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  ...(encryption === 'tls' && !secure ? { requireTLS: true } : {}),
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

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readFields(req) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Headers first; body as fallback
  const to = header(req, 'x-to') ?? body.to;
  const subject = header(req, 'x-subject') ?? body.subject;
  const html = decodeMaybeB64(header(req, 'x-html') ?? body.html, header(req, 'x-html-b64'));
  const text = decodeMaybeB64(header(req, 'x-text') ?? body.text, header(req, 'x-text-b64'));
  const replyTo = header(req, 'x-reply-to') ?? body.replyTo;

  return { to, subject, html, text, replyTo };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!secretIsValid(header(req, 'x-api-secret'))) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { to, subject, html, text, replyTo } = readFields(req);

  if (!isEmail(to) || typeof subject !== 'string' || !subject || typeof html !== 'string' || !html) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  if (replyTo !== undefined && !isEmail(replyTo)) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  const plainText = typeof text === 'string' && text.trim() ? text : htmlToText(html);

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      replyTo: replyTo || fromAddress,
      subject,
      // multipart/alternative : HTML + texte → moins de spam
      text: plainText,
      html,
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      },
    });
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('send_failed', err.message);
    return res.status(500).json({ error: 'send_failed' });
  }
}
