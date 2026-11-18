export function formatCurrencyBRL(value: number | undefined | null): string {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(safeValue);
}

export function formatShortDate(isoDate: string | undefined | null): string {
  if (!isoDate || typeof isoDate !== 'string') return 'Data a definir';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Data a definir';
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
  if (!startIso || !endIso || typeof startIso !== 'string' || typeof endIso !== 'string') {
    return 'Datas flexíveis';
  }
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Datas flexíveis';
  const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const endStr = end.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
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
