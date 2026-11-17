import { Trip } from '@/types';
import { formatCurrencyBRL } from './formatters';

export function buildWhatsAppLink(
  whatsapp: string | undefined,
  trip: Trip,
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://sounativo.vercel.app'
): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, '');
  if (!digits) return null;

  const tripUrl = `${origin}/viagem/${trip.slug || trip.id}`;
  const message = [
    `Olá! Vi o pacote *${trip.title}* no SouNativo.`,
    `Destino: ${trip.destination}`,
    `Duração: ${trip.durationDays} dias`,
    `Valor: ${formatCurrencyBRL(trip.price)} por pessoa`,
    `Link: ${tripUrl}`,
  ].join('\n');

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
