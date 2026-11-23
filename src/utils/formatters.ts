export function formatCurrencyBRL(value: number | undefined | null): string {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(safeValue);
}

export function parseDateSafe(isoDate: string | undefined | null): Date | null {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const trimmed = isoDate.trim();
  if (!trimmed) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T12:00:00` : trimmed;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatShortDate(isoDate: string | undefined | null): string {
  const date = parseDateSafe(isoDate);
  if (!date) return 'Data a definir';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateRange(
  startIso: string | undefined | null,
  endIso: string | undefined | null
): string {
  const start = parseDateSafe(startIso);
  const end = parseDateSafe(endIso);
  if (!start || !end) {
    return 'Datas flexíveis';
  }
  const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const endStr = end.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export function formatPaymentMethod(method: string | undefined | null): string {
  switch (method) {
    case 'PIX':
      return 'Pix';
    case 'CREDIT_CARD':
      return 'Cartão de Crédito';
    case 'BOLETO':
      return 'Boleto Bancário';
    default:
      return method || 'Pix';
  }
}

export function getInitials(name: string | undefined | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'SN';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase() || 'SN';
}

export function normalizeSearchText(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
