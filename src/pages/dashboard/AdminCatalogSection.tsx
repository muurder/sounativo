import React, { useState } from 'react';
import {
  Clock,
  Eye,
  EyeOff,
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

interface AdminCatalogSectionProps {
  agencies: AdminManagedAgency[];
  trips: Trip[];
  onAgencyControl: (
    agencyId: string,
    updates: {
      verified?: boolean;
      isActive?: boolean;
      subscriptionPlan?: PlanTier;
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
  onAgencyControl,
  onTripControl,
  onDeleteTrip,
}) => {
  const [busyAgencyId, setBusyAgencyId] = useState<string | null>(null);
  const [busyTripId, setBusyTripId] = useState<string | null>(null);

  const safeAgencies = Array.isArray(agencies) ? agencies : [];
  const safeTrips = Array.isArray(trips) ? trips : [];

  const runAgencyUpdate = async (
    agencyId: string,
    updates: {
      verified?: boolean;
      isActive?: boolean;
      subscriptionPlan?: PlanTier;
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
    } finally {
      setBusyTripId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
        <h2 className="font-serif text-xl font-bold text-stone-900">
          Agências, Agentes &amp; Planos ({safeAgencies.length})
        </h2>

        {safeAgencies.length === 0 ? (
          <p className="text-sm text-stone-500">
            Nenhuma agência ou agente cadastrado no Firestore ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {safeAgencies.map((ag) => (
              <div
                key={ag.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-stone-200 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ag.verified ? 'success' : 'neutral'}>
                      {ag.verified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                      {ag.verified ? 'Verificada' : 'Pendente selo'}
                    </Badge>
                    <Badge tone={ag.isGuide ? 'secondary' : 'primary'}>
                      {ag.isGuide ? 'Guia / Agente' : 'Agência'}
                    </Badge>
                    {!ag.isActive && <Badge tone="warning">Microsite suspenso</Badge>}
                    {ag.subscriptionStatus === 'PENDING' && (
                      <Badge tone="warning">
                        <Clock size={12} /> Upgrade {ag.subscriptionPlan} solicitado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    {ag.name} (/{ag.slug})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Plano de ${ag.name}`}
                    disabled={busyAgencyId === ag.id}
                    value={ag.subscriptionPlan}
                    onChange={(e) =>
                      void runAgencyUpdate(ag.id, {
                        subscriptionPlan: e.target.value as PlanTier,
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
                          subscriptionPlan: ag.subscriptionPlan,
                          subscriptionStatus: 'ACTIVE',
                        })
                      }
                    >
                      Aprovar plano
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
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-3">
        <h2 className="font-serif text-xl font-bold text-stone-900">
          Curadoria &amp; Moderação de Roteiros ({safeTrips.length})
        </h2>

        {safeTrips.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhum roteiro publicado no Firestore ainda.</p>
        ) : (
          safeTrips.map((trip) => (
            <div
              key={trip.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-stone-200 p-3.5"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={trip.isActive ? 'success' : 'warning'}>
                    {trip.isActive ? 'Ativo' : 'Pausado'}
                  </Badge>
                  <span className="text-xs text-stone-500">
                    {trip.agencyName} · {trip.destination} · {formatCurrencyBRL(trip.price)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-stone-900 truncate">{trip.title}</p>
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
                  onClick={() => void runTripDelete(trip.id)}
                >
                  <Trash2 size={14} className="text-red-600" />
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
