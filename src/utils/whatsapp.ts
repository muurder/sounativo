import { Trip } from '@/types';
import { formatCurrencyBRL } from './formatters';

export function normalizeWhatsAppDigits(whatsapp: string | undefined): string | null {
  if (!whatsapp) return null;
  const rawDigits = whatsapp.replace(/\D/g, '');
  if (!rawDigits) return null;
  return rawDigits.length === 10 || rawDigits.length === 11 ? `55${rawDigits}` : rawDigits;
}

export function buildAgencyWhatsAppLink(
  whatsapp: string | undefined,
  message?: string
): string | null {
  const digits = normalizeWhatsAppDigits(whatsapp);
  if (!digits) return null;
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}

export function buildWhatsAppLink(
  whatsapp: string | undefined,
  trip: Trip,
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://sounativo.vercel.app'
): string | null {
  const tripUrl = `${origin}/viagem/${trip.slug || trip.id}`;
  const message = [
    `Olá! Vi o pacote *${trip.title}* no SouNativo.`,
    `Destino: ${trip.destination}`,
    `Duração: ${trip.durationDays} dias`,
    `Valor: ${formatCurrencyBRL(trip.price)} por pessoa`,
    `Link: ${tripUrl}`,
  ].join('\n');

  return buildAgencyWhatsAppLink(whatsapp, message);
}
