export type UserRole = 'CLIENT' | 'AGENCY' | 'GUIDE' | 'ADMIN';

export interface GuideDetails {
  cadastur: string;
  languages: string[];
  specialties: string[];
  regions: string[];
  experienceYears: number;
  availability: 'FULL_TIME' | 'PART_TIME' | 'ON_DEMAND';
  bio: string;
  librasSupported?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  favorites: string[];
  notificationsEnabled: boolean;
  agencyId?: string;
  createdAt?: string;
  updatedAt?: string;
}
