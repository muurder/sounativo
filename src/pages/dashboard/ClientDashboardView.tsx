import React, { useState } from 'react';
import { Calendar, Heart, ShieldCheck, UserCheck } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBookings } from '@/hooks/useBookings';
import { useTrips } from '@/hooks/useTrips';
import { useToast } from '@/context/ToastContext';
import { TripGrid } from '@/components/trips/TripGrid';
import { ClientBookingsTab } from './ClientBookingsTab';
import { ClientProfileForm } from './ClientProfileForm';
import { PrivacySettings } from './PrivacySettings';

export const ClientDashboardView: React.FC = () => {
  const { profile, saving, updateProfile, toggleFavorite } = useUserProfile();
  const { bookings, loading: bookingsLoading, updateStatus } = useBookings();
  const { allTrips } = useTrips();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites' | 'profile' | 'privacy'>(
    'bookings'
  );

  const favoriteTrips = allTrips.filter((t) => profile?.favorites.includes(t.id));

  const handleToggleFavorite = async (tripId: string) => {
    try {
      const added = await toggleFavorite(tripId);
      showToast(added ? 'Roteiro salvo nos favoritos.' : 'Removido dos favoritos.', 'info');
    } catch {
      showToast('Não foi possível atualizar seus favoritos.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'bookings', label: `Minhas Reservas (${bookings.length})`, icon: Calendar },
          { id: 'favorites', label: `Favoritos (${favoriteTrips.length})`, icon: Heart },
          { id: 'profile', label: 'Meus Dados', icon: UserCheck },
          { id: 'privacy', label: 'Privacidade & LGPD', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 min-h-[42px] px-4 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'bookings' && (
        <ClientBookingsTab
          bookings={bookings}
          loading={bookingsLoading}
          onUpdateStatus={updateStatus}
        />
      )}

      {activeTab === 'favorites' && (
        <TripGrid
          trips={favoriteTrips}
          loading={false}
          favorites={profile?.favorites ?? []}
          onToggleFavorite={(id) => void handleToggleFavorite(id)}
        />
      )}

      {activeTab === 'profile' && (
        <ClientProfileForm profile={profile} saving={saving} onSave={updateProfile} />
      )}

      {activeTab === 'privacy' && <PrivacySettings />}
    </div>
  );
};
