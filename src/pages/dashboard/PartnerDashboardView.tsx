import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Palette, Plus, ShieldCheck } from 'lucide-react';
import {
  createAgencyInFirestore,
  fetchAgencyByOwner,
  updateAgencyThemeInFirestore,
} from '@/services/agencyService';
import { fetchTripsByAgency } from '@/services/tripService';
import { fetchAgencyBookings, updateBookingStatusInFirestore } from '@/services/bookingService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { useToast } from '@/context/ToastContext';
import { Agency, Booking, Trip } from '@/types';
import { SUBSCRIPTION_PLANS } from '@/utils/constants';
import { slugify } from '@/utils/slugUtils';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TripCreateModal } from './TripCreateModal';

export const PartnerDashboardView: React.FC = () => {
  const { profile, updateProfile } = useUserProfile();
  const { showToast } = useToast();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Onboarding state when partner hasn't created agency profile yet
  const [orgName, setOrgName] = useState('');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isGuide, setIsGuide] = useState(profile?.role === 'GUIDE');
  const [cadastur, setCadastur] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Theme Builder state
  const [primaryHex, setPrimaryHex] = useState('#0F4C3A');
  const [secondaryHex, setSecondaryHex] = useState('#C66B3D');

  const permissions = usePlanPermissions(agency?.subscriptionPlan, trips.length);

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
          if (found.theme?.colors) {
            setPrimaryHex(found.theme.colors.primary);
            setSecondaryHex(found.theme.colors.secondary);
          }
          const [agencyTrips, agencyBookings] = await Promise.all([
            fetchTripsByAgency(found.id),
            fetchAgencyBookings(found.id),
          ]);
          setTrips(agencyTrips);
          setBookings(agencyBookings);
        }
      })
      .finally(() => setLoading(false));
  }, [profile?.uid]);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    setCreatingOrg(true);

    try {
      const created = await createAgencyInFirestore({
        ownerUid: profile.uid,
        name: orgName.trim(),
        slug: `${slugify(orgName)}-${profile.uid.slice(0, 4).toLowerCase()}`,
        description: isGuide
          ? 'Guia local credenciado pelo SouNativo.'
          : 'Agência parceira curada pelo SouNativo.',
        logo:
          profile.photoURL ||
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80',
        whatsapp: whatsapp.trim(),
        city: city.trim(),
        state: 'BR',
        isGuide,
        cadastur: isGuide ? cadastur.trim() : '',
        heroMode: 'TRIPS',
        subscriptionPlan: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      });

      await updateProfile({
        agencyId: created.id,
        role: isGuide ? 'GUIDE' : 'AGENCY',
      });

      setAgency(created);
      showToast('Microsite de parceiro criado no Firestore!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao criar perfil parceiro.', 'error');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!agency) return;
    try {
      await updateAgencyThemeInFirestore(agency.id, {
        colors: {
          primary: primaryHex,
          secondary: secondaryHex,
          background: '#FAFAF9',
          text: '#1C1917',
        },
        fontPair: 'classic',
        borderRadius: 'soft',
        buttonStyle: 'solid',
        headerStyle: 'solid',
      });
      showToast('Identidade visual do microsite atualizada!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar tema.', 'error');
    }
  };

  if (loading) return <p className="text-sm text-stone-500">Carregando painel do parceiro...</p>;

  if (!agency) {
    return (
      <form
        onSubmit={handleCreatePartner}
        className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4"
      >
        <Badge tone="secondary">Onboarding de Parceiro</Badge>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Ative sua Agência ou Perfil de Guia
        </h2>
        <p className="text-sm text-stone-600">
          Publique roteiros, receba reservas e tenha seu microsite exclusivo em{' '}
          <code>sounativo.com/seu-slug</code>.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsGuide(false)}
            className={`flex-1 min-h-[44px] rounded-xl border text-sm font-semibold ${
              !isGuide ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200'
            }`}
          >
            Agência de Viagens
          </button>
          <button
            type="button"
            onClick={() => setIsGuide(true)}
            className={`flex-1 min-h-[44px] rounded-xl border text-sm font-semibold ${
              isGuide ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200'
            }`}
          >
            Guia Cadastur
          </button>
        </div>

        <div>
          <label
            htmlFor="partner-org-name"
            className="block text-xs font-semibold text-stone-700 mb-1"
          >
            {isGuide ? 'Nome profissional' : 'Nome da agência'}
          </label>
          <input
            id="partner-org-name"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder={isGuide ? 'Seu nome profissional' : 'Nome da agência'}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="partner-city"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Cidade base
            </label>
            <input
              id="partner-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade base (ex: Paraty)"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="partner-whatsapp"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              WhatsApp com DDD
            </label>
            <input
              id="partner-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp com DDD"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
        </div>

        {isGuide && (
          <div>
            <label
              htmlFor="partner-cadastur"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Número Cadastur
            </label>
            <input
              id="partner-cadastur"
              value={cadastur}
              onChange={(e) => setCadastur(e.target.value)}
              placeholder="Número Cadastur (opcional)"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
        )}

        <Button type="submit" loading={creatingOrg}>
          Criar meu microsite grátis
        </Button>
      </form>
    );
  }

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
          onClick={() => setCreateOpen(true)}
        >
          Novo Pacote ({trips.length}/
          {Number.isFinite(permissions.maxTrips) ? permissions.maxTrips : '∞'})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Reservas Recebidas ({bookings.length})
          </h3>
          {bookings.length === 0 ? (
            <p className="text-sm text-stone-500">Nenhuma reserva solicitada ainda.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-stone-200 p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-sm text-stone-900">{b.tripTitle}</p>
                    <p className="text-xs text-stone-600">
                      {b.clientName} · {formatCurrencyBRL(b.totalPrice)} · {b.status}
                    </p>
                  </div>
                  {b.status === 'PENDING' && (
                    <Button
                      size="sm"
                      leftIcon={<CheckCircle2 size={14} />}
                      onClick={() =>
                        void updateBookingStatusInFirestore(b.id, 'CONFIRMED').then(() => {
                          setBookings((prev) =>
                            prev.map((item) =>
                              item.id === b.id ? { ...item, status: 'CONFIRMED' } : item
                            )
                          );
                          showToast('Reserva confirmada!', 'success');
                        })
                      }
                    >
                      Confirmar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-secondary-600" />
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Smart Site Builder (Cores)
            </h3>
          </div>
          <p className="text-xs text-stone-600">
            Personalize as cores aplicadas dinamicamente na sua página dedicada{' '}
            <code>/{agency.slug}</code>.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-xs font-semibold text-stone-700">
              Cor Primária
              <input
                type="color"
                value={primaryHex}
                onChange={(e) => setPrimaryHex(e.target.value)}
                className="mt-1 block h-11 w-full rounded-xl border border-stone-300 cursor-pointer"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              Cor Secundária
              <input
                type="color"
                value={secondaryHex}
                onChange={(e) => setSecondaryHex(e.target.value)}
                className="mt-1 block h-11 w-full rounded-xl border border-stone-300 cursor-pointer"
              />
            </label>
          </div>

          <Button variant="outline" onClick={() => void handleSaveTheme()}>
            Salvar identidade do microsite
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-5 bg-white ${
              plan.id === agency.subscriptionPlan
                ? 'border-primary-500 ring-1 ring-primary-500'
                : 'border-stone-200'
            }`}
          >
            <h4 className="font-serif text-lg font-bold text-stone-900">{plan.name}</h4>
            <p className="text-2xl font-extrabold text-primary-600 mt-1">
              {plan.priceMonthly === 0 ? 'Grátis' : `${formatCurrencyBRL(plan.priceMonthly)}/mês`}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-stone-600">
              {plan.features.map((feat) => (
                <li key={feat}>• {feat}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <TripCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        agency={agency}
        onCreated={(created) => setTrips((prev) => [created, ...prev])}
      />
    </div>
  );
};
