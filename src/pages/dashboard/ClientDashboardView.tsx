import React, { useEffect, useState } from 'react';
import { Calendar, Heart, Save, UserCheck } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBookings } from '@/hooks/useBookings';
import { useTrips } from '@/hooks/useTrips';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { TripGrid } from '@/components/trips/TripGrid';
import { formatCurrencyBRL } from '@/utils/formatters';

export const ClientDashboardView: React.FC = () => {
  const { profile, saving, updateProfile, toggleFavorite } = useUserProfile();
  const { bookings, loading: bookingsLoading, updateStatus } = useBookings();
  const { allTrips } = useTrips();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites' | 'profile'>('bookings');
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [cpf, setCpf] = useState(profile?.cpf ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationsEnabled ?? true
  );

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhone(profile.phone ?? '');
      setCpf(profile.cpf ?? '');
      setNotificationsEnabled(profile.notificationsEnabled ?? true);
    }
  }, [profile]);

  const favoriteTrips = allTrips.filter((t) => profile?.favorites.includes(t.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, phone, cpf, notificationsEnabled });
      showToast('Perfil sincronizado no Firestore!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar perfil.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'bookings', label: `Minhas Reservas (${bookings.length})`, icon: Calendar },
          { id: 'favorites', label: `Favoritos (${favoriteTrips.length})`, icon: Heart },
          { id: 'profile', label: 'Meus Dados', icon: UserCheck },
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
        <div className="space-y-4">
          {bookingsLoading ? (
            <p className="text-sm text-stone-500">Carregando reservas...</p>
          ) : bookings.length === 0 ? (
            <EmptyState
              title="Nenhuma reserva ainda"
              description="Quando você solicitar uma reserva em qualquer pacote do SouNativo, ela aparecerá aqui com seu código de voucher."
            />
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-card"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        booking.status === 'CONFIRMED'
                          ? 'success'
                          : booking.status === 'CANCELLED'
                            ? 'warning'
                            : 'secondary'
                      }
                    >
                      {booking.status}
                    </Badge>
                    <span className="text-xs font-mono text-stone-500">{booking.voucherCode}</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    {booking.tripTitle}
                  </h3>
                  <p className="text-xs text-stone-600">
                    {booking.agencyName} · {booking.adults} adulto(s)
                    {booking.children > 0 ? `, ${booking.children} criança(s)` : ''} ·{' '}
                    <strong>{formatCurrencyBRL(booking.totalPrice)}</strong>
                  </p>
                </div>

                {booking.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void updateStatus(booking.id, 'CANCELLED').then(() =>
                        showToast('Reserva cancelada.', 'info')
                      )
                    }
                  >
                    Cancelar solicitação
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <TripGrid
          trips={favoriteTrips}
          loading={false}
          favorites={profile?.favorites ?? []}
          onToggleFavorite={(id) => void toggleFavorite(id)}
        />
      )}

      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4"
        >
          <h2 className="font-serif text-xl font-bold text-stone-900">Dados do Viajante</h2>
          <p className="text-xs text-stone-500">
            Sincronizado em tempo real com <code>users/{profile?.uid}</code> no Cloud Firestore.
          </p>

          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-stone-700 mb-1">
              Nome completo
            </label>
            <input
              id="prof-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="prof-phone"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                WhatsApp / Telefone
              </label>
              <input
                id="prof-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="prof-cpf" className="block text-xs font-semibold text-stone-700 mb-1">
                CPF
              </label>
              <input
                id="prof-cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-stone-700 pt-1">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-primary-600"
            />
            Receber atualizações de reservas e curadorias SouNativo
          </label>

          <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
            Salvar alterações
          </Button>
        </form>
      )}
    </div>
  );
};
