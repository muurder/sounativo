import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Plus, ShieldCheck } from 'lucide-react';
import { fetchAgencyByOwner } from '@/services/agencyService';
import { fetchTripsByAgency } from '@/services/tripService';
import { fetchAgencyBookings } from '@/services/bookingService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { Agency, Booking, Trip } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TripCreateModal } from './TripCreateModal';
import { PartnerOnboardingForm } from './PartnerOnboardingForm';
import { PartnerTripsSection } from './PartnerTripsSection';
import { PartnerBookingsSection } from './PartnerBookingsSection';
import { PartnerThemeBuilder } from './PartnerThemeBuilder';
import { PartnerProfileForm } from './PartnerProfileForm';
import { PartnerPlansSection } from './PartnerPlansSection';

export const PartnerDashboardView: React.FC = () => {
  const { profile, updateProfile } = useUserProfile();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const activeTripsCount = trips.filter((t) => t.isActive).length;
  const permissions = usePlanPermissions(agency?.subscriptionPlan, activeTripsCount);

  useEffect(() => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAgencyByOwner(profile.uid)
      .then(async (found) => {
        setAgency(found);
        if (found) {
          const [agencyTrips, agencyBookings] = await Promise.all([
            fetchTripsByAgency(found.id, true),
            fetchAgencyBookings(found.id),
          ]);
          setTrips(agencyTrips);
          setBookings(agencyBookings);
        }
      })
      .finally(() => setLoading(false));
  }, [profile?.uid]);

  if (loading) return <p className="text-sm text-stone-500">Carregando painel do parceiro...</p>;

  if (!agency && profile) {
    return (
      <PartnerOnboardingForm
        profile={profile}
        onUpdateProfile={(updates) => updateProfile(updates)}
        onCreated={(created) => setAgency(created)}
      />
    );
  }

  if (!agency) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">
              {agency.isGuide ? <Award size={12} /> : <ShieldCheck size={12} />}
              Plano {permissions.planName}
            </Badge>
            <Link
              to={`/${agency.slug}`}
              className="text-xs font-semibold text-primary-600 hover:underline"
            >
              Ver meu microsite /{agency.slug}
            </Link>
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">{agency.name}</h2>
        </div>

        <Button
          leftIcon={<Plus size={16} />}
          disabled={!permissions.canPublishMoreTrips}
          onClick={() => {
            setEditingTrip(null);
            setCreateOpen(true);
          }}
        >
          Novo Pacote ({activeTripsCount}/
          {Number.isFinite(permissions.maxTrips) ? permissions.maxTrips : '∞'})
        </Button>
      </div>

      <PartnerTripsSection
        trips={trips}
        onEdit={(trip) => {
          setEditingTrip(trip);
          setCreateOpen(true);
        }}
        onTripUpdated={(updated) =>
          setTrips((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
        onTripDeleted={(tripId) => setTrips((prev) => prev.filter((item) => item.id !== tripId))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PartnerBookingsSection
          bookings={bookings}
          onBookingUpdated={(bookingId, status) =>
            setBookings((prev) =>
              prev.map((item) => (item.id === bookingId ? { ...item, status } : item))
            )
          }
        />

        <PartnerThemeBuilder
          agency={agency}
          onThemeUpdated={(theme) => setAgency((prev) => (prev ? { ...prev, theme } : prev))}
        />
      </div>

      <PartnerProfileForm agency={agency} onUpdated={setAgency} />
      <PartnerPlansSection currentPlan={agency.subscriptionPlan} />

      <TripCreateModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingTrip(null);
        }}
        agency={agency}
        editingTrip={editingTrip}
        onCreated={(created) => setTrips((prev) => [created, ...prev])}
        onUpdated={(updated) =>
          setTrips((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
      />
    </div>
  );
};
