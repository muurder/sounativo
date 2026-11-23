const BASE_URL = 'https://sounativo.vercel.app';
const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readFirestoreField(fields, key) {
  const node = fields && fields[key];
  if (!node || typeof node !== 'object') return undefined;
  if ('stringValue' in node) return node.stringValue;
  if ('integerValue' in node) return Number(node.integerValue);
  if ('doubleValue' in node) return Number(node.doubleValue);
  if ('booleanValue' in node) return Boolean(node.booleanValue);
  if ('arrayValue' in node && Array.isArray(node.arrayValue?.values)) {
    return node.arrayValue.values
      .map((item) => item?.stringValue)
      .filter((v) => typeof v === 'string');
  }
  return undefined;
}

async function queryFirestoreBySlug(projectId, collectionId, slug) {
  if (!projectId || !slug) return null;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: slug },
            },
          },
          limit: 1,
        },
      }),
    });

    if (!response.ok) return null;
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows[0]?.document?.fields) return null;
    return rows[0].document.fields;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const type = String(req.query?.type || 'trip').toLowerCase();
  const slug = String(req.query?.slug || '').trim().slice(0, 180);
  const agencyParam = String(req.query?.agency || '').trim().slice(0, 100);
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'sounativo-app-br';

  let title = 'SouNativo | Experiências Autênticas de Viagem pelo Brasil';
  let description =
    'Explore roteiros autorais de natureza, cultura e aventura operados por agências verificadas e guias locais.';
  let image = DEFAULT_OG_IMAGE;
  let canonicalPath = '/';

  if (type === 'agency' && slug) {
    canonicalPath = `/${encodeURIComponent(slug)}`;
    const fields = await queryFirestoreBySlug(projectId, 'agencies', slug);
    if (fields) {
      const name = readFirestoreField(fields, 'name') || slug;
      const desc = readFirestoreField(fields, 'description');
      const logo =
        readFirestoreField(fields, 'heroBannerUrl') ||
        readFirestoreField(fields, 'logo') ||
        DEFAULT_OG_IMAGE;
      title = `${name} | Parceiro Verificado SouNativo`;
      if (desc) description = String(desc).slice(0, 220);
      if (typeof logo === 'string' && /^https?:\/\//i.test(logo)) image = logo;
    }
  } else if (slug) {
    canonicalPath = agencyParam
      ? `/${encodeURIComponent(agencyParam)}/viagem/${encodeURIComponent(slug)}`
      : `/viagem/${encodeURIComponent(slug)}`;
    const fields = await queryFirestoreBySlug(projectId, 'trips', slug);
    if (fields && readFirestoreField(fields, 'isActive') !== false) {
      const tripTitle = readFirestoreField(fields, 'title') || slug;
      const dest = readFirestoreField(fields, 'destination') || 'Brasil';
      const price = readFirestoreField(fields, 'price');
      const desc = readFirestoreField(fields, 'description');
      const images = readFirestoreField(fields, 'images');
      const priceLabel =
        typeof price === 'number' && price > 0
          ? ` · A partir de R$ ${Math.round(price).toLocaleString('pt-BR')}`
          : '';
      title = `${tripTitle} (${dest}) | SouNativo`;
      description = desc
        ? `${String(desc).slice(0, 190)}${priceLabel}`
        : `Roteiro verificado em ${dest}${priceLabel}.`;
      if (Array.isArray(images) && images[0] && /^https?:\/\//i.test(images[0])) {
        image = images[0];
      }
    }
  }

  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:site_name" content="SouNativo" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="${type === 'agency' ? 'profile' : 'website'}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <a href="${escapeHtml(canonicalUrl)}">Abrir no SouNativo</a>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(html);
}
