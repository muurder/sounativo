import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Search,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import { AdminManagedAgency } from '@/services/adminService';
import { PlanTier, SubscriptionStatus, Trip } from '@/types';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';

interface AdminCatalogSectionProps {
  agencies: AdminManagedAgency[];
  trips: Trip[];
  sectionMode?: 'all' | 'agencies' | 'trips';
  onAgencyControl: (
    agencyId: string,
    updates: {
      verified?: boolean;
      isActive?: boolean;
      subscriptionPlan?: PlanTier;
      requestedPlan?: PlanTier | null;
      subscriptionStatus?: SubscriptionStatus;
    }
  ) => Promise<void>;
  onTripControl: (
    tripId: string,
    updates: { featured?: boolean; isActive?: boolean }
  ) => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
}

export const AdminCatalogSection: React.FC<AdminCatalogSectionProps> = ({
  agencies,
  trips,
  sectionMode = 'all',
  onAgencyControl,
  onTripControl,
  onDeleteTrip,
}) => {
  const [busyAgencyId, setBusyAgencyId] = useState<string | null>(null);
  const [busyTripId, setBusyTripId] = useState<string | null>(null);
  const [confirmDeleteTripId, setConfirmDeleteTripId] = useState<string | null>(null);

  // Filters for Agencies & Guides
  const [agencySearch, setAgencySearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<
    'ALL' | 'AGENCY' | 'GUIDE' | 'PENDING_UPGRADE' | 'UNVERIFIED'
  >('ALL');

  // Filters for Trips
  const [tripSearch, setTripSearch] = useState('');
  const [tripFilter, setTripFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'FEATURED'>('ALL');

  const safeAgencies = useMemo(() => (Array.isArray(agencies) ? agencies : []), [agencies]);
  const safeTrips = useMemo(() => (Array.isArray(trips) ? trips : []), [trips]);

  const filteredAgencies = useMemo(() => {
    const q = agencySearch.trim().toLowerCase();
    return safeAgencies.filter((ag) => {
      if (agencyFilter === 'AGENCY' && ag.isGuide) return false;
      if (agencyFilter === 'GUIDE' && !ag.isGuide) return false;
      if (agencyFilter === 'PENDING_UPGRADE' && ag.subscriptionStatus !== 'PENDING') return false;
      if (agencyFilter === 'UNVERIFIED' && ag.verified) return false;
      if (!q) return true;
      return (
        (ag.name ?? '').toLowerCase().includes(q) ||
        (ag.slug ?? '').toLowerCase().includes(q) ||
        (ag.city ?? '').toLowerCase().includes(q) ||
        (ag.email ?? '').toLowerCase().includes(q) ||
        (ag.cadastur ?? '').toLowerCase().includes(q)
      );
    });
  }, [agencyFilter, agencySearch, safeAgencies]);

  const filteredTrips = useMemo(() => {
    const q = tripSearch.trim().toLowerCase();
    return safeTrips.filter((t) => {
      if (tripFilter === 'ACTIVE' && !t.isActive) return false;
      if (tripFilter === 'PAUSED' && t.isActive) return false;
      if (tripFilter === 'FEATURED' && !t.featured) return false;
      if (!q) return true;
      return (
        (t.title ?? '').toLowerCase().includes(q) ||
        (t.destination ?? '').toLowerCase().includes(q) ||
        (t.agencyName ?? '').toLowerCase().includes(q)
      );
    });
  }, [safeTrips, tripFilter, tripSearch]);

  const runAgencyUpdate = async (
    agencyId: string,
    updates: {
      verified?: boolean;
      isActive?: boolean;
      subscriptionPlan?: PlanTier;
      requestedPlan?: PlanTier | null;
      subscriptionStatus?: SubscriptionStatus;
    }
  ) => {
    setBusyAgencyId(agencyId);
    try {
      await onAgencyControl(agencyId, updates);
    } finally {
      setBusyAgencyId(null);
    }
  };

  const runTripUpdate = async (
    tripId: string,
    updates: { featured?: boolean; isActive?: boolean }
  ) => {
    setBusyTripId(tripId);
    try {
      await onTripControl(tripId, updates);
    } finally {
      setBusyTripId(null);
    }
  };

  const runTripDelete = async (tripId: string) => {
    setBusyTripId(tripId);
    try {
      await onDeleteTrip(tripId);
      setConfirmDeleteTripId(null);
    } finally {
      setBusyTripId(null);
    }
  };

  return (
    <div className="space-y-8">
      {(sectionMode === 'all' || sectionMode === 'agencies') && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Agências, Guias de Turismo &amp; Planos ({filteredAgencies.length}/
                {safeAgencies.length})
              </h2>
              <p className="text-xs text-stone-500">
                Verifique credenciais Cadastur/CNPJ, aprove upgrades de assinatura e gerencie
                microsites.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="search"
                  value={agencySearch}
                  onChange={(e) => setAgencySearch(e.target.value)}
                  placeholder="Nome, slug, Cadastur..."
                  className="min-h-[38px] w-full sm:w-52 rounded-xl border border-stone-300 pl-8 pr-3 text-xs"
                />
              </div>

              <select
                aria-label="Filtrar parceiros"
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value as typeof agencyFilter)}
                className="min-h-[38px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-semibold"
              >
                <option value="ALL">Todos os parceiros</option>
                <option value="AGENCY">Apenas Agências</option>
                <option value="GUIDE">Apenas Guias de Turismo</option>
                <option value="PENDING_UPGRADE">Upgrades Pendentes</option>
                <option value="UNVERIFIED">Aguardando Selo</option>
              </select>
            </div>
          </div>

          {filteredAgencies.length === 0 ? (
            <p className="text-sm text-stone-500">
              Nenhum parceiro encontrado com os filtros atuais.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAgencies.map((ag) => {
                const targetUpgradePlan = ag.requestedPlan ?? ag.subscriptionPlan;
                return (
                  <div
                    key={ag.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <SafeImage
                        src={ag.logo}
                        alt={ag.name}
                        className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0 hidden sm:block"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={ag.verified ? 'success' : 'neutral'}>
                            {ag.verified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                            {ag.verified ? 'Verificado' : 'Pendente selo'}
                          </Badge>
                          <Badge tone={ag.isGuide ? 'secondary' : 'primary'}>
                            {ag.isGuide ? 'Guia de Turismo' : 'Agência de Turismo'}
                          </Badge>
                          {!ag.isActive && <Badge tone="warning">Microsite suspenso</Badge>}
                          {ag.subscriptionStatus === 'PENDING' && (
                            <Badge tone="warning">
                              <Clock size={12} /> Upgrade {targetUpgradePlan} solicitado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-stone-900">{ag.name}</p>
                          <Link
                            to={`/${ag.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                          >
                            /{ag.slug} <ExternalLink size={11} />
                          </Link>
                        </div>
                        <p className="text-xs text-stone-500">
                          {[
                            ag.city ? `${ag.city}${ag.state ? `/${ag.state}` : ''}` : ag.state,
                            ag.cadastur ? `Cadastur: ${ag.cadastur}` : 'Cadastur não informado',
                            ag.cnpj ? `CNPJ: ${ag.cnpj}` : null,
                            ag.email || null,
                            ag.whatsapp ? `WA: ${ag.whatsapp}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label={`Plano de ${ag.name}`}
                        disabled={busyAgencyId === ag.id}
                        value={ag.subscriptionPlan}
                        onChange={(e) =>
                          void runAgencyUpdate(ag.id, {
                            subscriptionPlan: e.target.value as PlanTier,
                            requestedPlan: null,
                            subscriptionStatus: 'ACTIVE',
                          })
                        }
                        className="min-h-[38px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-semibold disabled:opacity-60"
                      >
                        <option value="STARTER">Starter (Grátis)</option>
                        <option value="BASIC">Básico</option>
                        <option value="PREMIUM">Premium</option>
                      </select>

                      {ag.subscriptionStatus === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busyAgencyId === ag.id}
                          onClick={() =>
                            void runAgencyUpdate(ag.id, {
                              subscriptionPlan: targetUpgradePlan,
                              requestedPlan: null,
                              subscriptionStatus: 'ACTIVE',
                            })
                          }
                        >
                          Aprovar {targetUpgradePlan}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        loading={busyAgencyId === ag.id}
                        variant={ag.verified ? 'outline' : 'primary'}
                        onClick={() => void runAgencyUpdate(ag.id, { verified: !ag.verified })}
                      >
                        {ag.verified ? 'Remover selo' : 'Verificar'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyAgencyId === ag.id}
                        leftIcon={<ShieldBan size={14} className="text-stone-500" />}
                        onClick={() => void runAgencyUpdate(ag.id, { isActive: !ag.isActive })}
                      >
                        {ag.isActive ? 'Pausar' : 'Reativar'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {(sectionMode === 'all' || sectionMode === 'trips') && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Curadoria &amp; Moderação de Pacotes e Experiências ({filteredTrips.length}/
                {safeTrips.length})
              </h2>
              <p className="text-xs text-stone-500">
                Destaque roteiros na vitrine principal, pause ofertas ou remova conteúdos
                irregulares.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="search"
                  value={tripSearch}
                  onChange={(e) => setTripSearch(e.target.value)}
                  placeholder="Título, destino ou parceiro..."
                  className="min-h-[38px] w-full sm:w-52 rounded-xl border border-stone-300 pl-8 pr-3 text-xs"
                />
              </div>

              <select
                aria-label="Filtrar roteiros"
                value={tripFilter}
                onChange={(e) => setTripFilter(e.target.value as typeof tripFilter)}
                className="min-h-[38px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-semibold"
              >
                <option value="ALL">Todos os roteiros</option>
                <option value="ACTIVE">Apenas Ativos</option>
                <option value="PAUSED">Apenas Pausados</option>
                <option value="FEATURED">Em Destaque</option>
              </select>
            </div>
          </div>

          {filteredTrips.length === 0 ? (
            <p className="text-sm text-stone-500">
              Nenhum roteiro encontrado com os filtros selecionados.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map((trip) => (
                <div key={trip.id} className="rounded-xl border border-stone-200 p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 hidden sm:block">
                        <SafeImage
                          src={trip.images?.[0]}
                          alt={trip.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={trip.isActive ? 'success' : 'warning'}>
                            {trip.isActive ? 'Ativo' : 'Pausado'}
                          </Badge>
                          {trip.featured && <Badge tone="primary">Destaque Home</Badge>}
                          <span className="text-xs text-stone-500">
                            {trip.agencyName} · {trip.destination} · {formatCurrencyBRL(trip.price)}
                          </span>
                        </div>
                        <Link
                          to={`/viagem/${trip.slug}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-stone-900 hover:text-primary-600 truncate"
                        >
                          {trip.title} <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        loading={busyTripId === trip.id}
                        variant={trip.featured ? 'primary' : 'outline'}
                        leftIcon={<Star size={14} />}
                        onClick={() => void runTripUpdate(trip.id, { featured: !trip.featured })}
                      >
                        {trip.featured ? 'Em destaque' : 'Destacar'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyTripId === trip.id}
                        leftIcon={trip.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        onClick={() => void runTripUpdate(trip.id, { isActive: !trip.isActive })}
                      >
                        {trip.isActive ? 'Pausar' : 'Ativar'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Remover pacote ${trip.title}`}
                        disabled={busyTripId === trip.id}
                        onClick={() =>
                          setConfirmDeleteTripId(confirmDeleteTripId === trip.id ? null : trip.id)
                        }
                      >
                        <Trash2 size={14} className="text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {confirmDeleteTripId === trip.id && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
                      <span>Confirmar exclusão administrativa de &ldquo;{trip.title}&rdquo;?</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyTripId === trip.id}
                          onClick={() => setConfirmDeleteTripId(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={busyTripId === trip.id}
                          onClick={() => void runTripDelete(trip.id)}
                        >
                          Confirmar exclusão
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
