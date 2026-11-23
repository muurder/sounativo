import type { GuideDetails } from './user';

export type PlanTier = 'STARTER' | 'BASIC' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  maxActiveTrips: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface AgencyTheme {
  colors: ThemeColors;
  fontPair: 'modern' | 'classic' | 'playful';
  borderRadius: 'none' | 'soft' | 'full';
  buttonStyle: 'solid' | 'outline' | 'ghost';
  headerStyle: 'solid' | 'transparent';
}

export interface Agency {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  city?: string;
  state?: string;
  isGuide: boolean;
  verified?: boolean;
  cnpj?: string;
  cadastur?: string;
  languages?: GuideDetails['languages'];
  specialties?: GuideDetails['specialties'];
  experienceYears?: GuideDetails['experienceYears'];
  availability?: GuideDetails['availability'];
  heroMode: 'TRIPS' | 'STATIC';
  heroBannerUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  subscriptionPlan: PlanTier;
  requestedPlan?: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  theme?: AgencyTheme;
  isActive: boolean;
  rating?: number;
  totalReviews?: number;
  createdAt?: string;
  updatedAt?: string;
}
