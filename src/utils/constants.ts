import { SubscriptionPlan, TripCategory } from '@/types';

export const BRAND_COLORS = {
  primary: '#0F4C3A',
  secondary: '#C66B3D',
  background: '#FAFAF9',
  ink: '#1C1917',
} as const;

export const HERO_QUOTES: readonly string[] = [
  'O Brasil que você ainda não viu.',
  'Sua próxima grande aventura começa aqui.',
  'Experiências autênticas, memórias eternas.',
  'Luxo discreto em cenários inesquecíveis.',
  'Viaje com curadoria, viva o extraordinário.',
  'Onde a alma encontra a natureza.',
];

export const CATEGORY_LABELS: Record<TripCategory | 'ALL', string> = {
  ALL: 'Todos',
  PRAIA: 'Praia',
  AVENTURA: 'Aventura',
  NATUREZA: 'Natureza',
  HISTORIA: 'História',
  GASTRONOMIA: 'Gastronomia',
  ROMANTICO: 'Romântico',
  VIDA_NOTURNA: 'Vida Noturna',
  CULTURA: 'Cultura',
  ARTE: 'Arte',
  VIAGEM_BARATA: 'Viagem Barata',
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    priceMonthly: 0,
    maxActiveTrips: 2,
    description: 'Ideal para guias autônomos e agências iniciantes.',
    features: ['Até 2 pacotes ativos', 'Página dedicada /:slug', 'Reservas via plataforma'],
  },
  {
    id: 'BASIC',
    name: 'Básico',
    priceMonthly: 59.9,
    maxActiveTrips: 5,
    description: 'Para agências em crescimento com identidade própria.',
    features: [
      'Até 5 pacotes ativos',
      'Página dedicada personalizada',
      'Suporte prioritário WhatsApp',
      'Gestão de avaliações',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    priceMonthly: 99.9,
    maxActiveTrips: Number.POSITIVE_INFINITY,
    description: 'Operação completa com escala ilimitada e marca whitelabel.',
    highlighted: true,
    features: [
      'Pacotes ilimitados',
      'Smart Site Builder completo',
      'Painel operacional de reservas',
      'Destaque na vitrine SouNativo',
    ],
  },
];

export const RESERVED_ROUTES = new Set([
  'trips',
  'viagem',
  'agencies',
  'guides',
  'about',
  'contact',
  'terms',
  'privacy',
  'dashboard',
  'client',
  'agency',
  'guide',
  'admin',
  'settings',
  'login',
  'signup',
]);
