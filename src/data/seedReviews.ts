import { TripReview } from '@/types';

export const SEED_REVIEWS: TripReview[] = [
  {
    id: 'rev-1',
    tripId: 'trip-lencois-maranhenses',
    agencyId: 'ag-chapada',
    userUid: 'seed-user-1',
    userName: 'Mariana Costa',
    rating: 5,
    comment:
      'Organização impecável do início ao fim. O guia conhecia horários alternativos para fugir da lotação nas lagoas.',
    createdAt: '2026-10-14T15:00:00Z',
  },
  {
    id: 'rev-2',
    tripId: 'trip-foz-iguacu',
    agencyId: 'ag-cataratas',
    userUid: 'seed-user-2',
    userName: 'Rafael Nogueira',
    rating: 5,
    comment:
      'Experiência incrível com minha família! Todo o roteiro funcionou no horário combinado.',
    createdAt: '2026-10-20T18:30:00Z',
  },
  {
    id: 'rev-3',
    tripId: 'trip-paraty-costa-verde',
    agencyId: 'guide-camila',
    userUid: 'seed-user-3',
    userName: 'Juliana Mendes',
    rating: 5,
    comment:
      'Viajei sozinha no grupo e me senti acolhida desde o embarque em São Paulo. Praia do Sono inesquecível.',
    createdAt: '2026-10-28T11:20:00Z',
  },
  {
    id: 'rev-4',
    tripId: 'trip-amazonia-rio-negro',
    agencyId: 'ag-amazonia',
    userUid: 'seed-user-4',
    userName: 'Lucas & Fernanda',
    rating: 5,
    comment:
      'O lodge sustentável no Rio Negro e a condução dos mateiros locais superaram todas as expectativas.',
    createdAt: '2026-11-03T16:40:00Z',
  },
];
