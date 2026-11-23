function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ALLOWED_LINK_ORIGINS = new Set([
  'https://sounativo.vercel.app',
  'https://viajastore.vercel.app',
]);
const DEFAULT_SAFE_LINK = 'https://sounativo.vercel.app/dashboard';

function sanitizeNotificationLink(rawLink) {
  const trimmed = String(rawLink || '').trim().slice(0, 300);
  if (!trimmed) return DEFAULT_SAFE_LINK;
  if (/^\/(?!\/)/.test(trimmed)) {
    return `https://sounativo.vercel.app${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' && ALLOWED_LINK_ORIGINS.has(parsed.origin)) {
      return parsed.toString();
    }
  } catch {
    // Fall through to safe default
  }
  return DEFAULT_SAFE_LINK;
}

async function verifyFirebaseIdToken(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || '').trim();
  if (!authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return null;

  const apiKey = (
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY ||
    ''
  ).trim();
  if (!apiKey) return null;

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!lookupRes.ok) return null;
    const data = await lookupRes.json();
    const uid = data?.users?.[0]?.localId;
    return typeof uid === 'string' && uid.length > 0 ? uid : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const verifiedUid = await verifyFirebaseIdToken(req);
  if (!verifiedUid) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const event = String(body.event || 'SYSTEM').slice(0, 60);
  const recipientEmail = String(body.recipientEmail || '').trim().slice(0, 254);
  const recipientName = String(body.recipientName || 'Viajante').trim().slice(0, 120);
  const subject = String(body.subject || 'Notificação SouNativo').trim().slice(0, 160);
  const summary = String(body.summary || '').trim().slice(0, 1200);
  const voucherCode = String(body.voucherCode || '').trim().slice(0, 40);
  const link = sanitizeNotificationLink(body.link);

  let dispatched = false;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || 'SouNativo <notificacoes@sounativo.com>';
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || '';
  const targetEmail = recipientEmail || adminEmail;

  if (resendKey && targetEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    try {
      const html = `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 16px; color: #1c1917;">
          <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0F4C3A; margin: 0 0 8px;">SouNativo</p>
          <h1 style="font-size: 20px; margin: 0 0 12px;">Olá, ${escapeHtml(recipientName)}</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c; margin: 0 0 16px;">${escapeHtml(summary)}</p>
          ${
            voucherCode
              ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 700;">Código do Voucher</span>
                  <div style="font-family: monospace; font-size: 20px; font-weight: 800; color: #14532d;">${escapeHtml(voucherCode)}</div>
                </div>`
              : ''
          }
          <a href="${escapeHtml(link)}" style="display: inline-block; background: #0F4C3A; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 18px; border-radius: 10px;">Acessar Painel SouNativo</a>
        </div>
      `;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [targetEmail],
          subject,
          html,
        }),
      });
      if (emailRes.ok) dispatched = true;
    } catch {
      // Non-blocking channel failure
    }
  }

  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
    try {
      const hookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          actorUid: verifiedUid,
          recipientEmail,
          recipientName,
          subject,
          summary,
          voucherCode,
          link,
          timestamp: new Date().toISOString(),
        }),
      });
      if (hookRes.ok) dispatched = true;
    } catch {
      // Non-blocking channel failure
    }
  }

  return res.status(200).json({
    ok: true,
    mode: dispatched ? 'dispatched' : 'noop',
  });
}
