import React from 'react';
import { ShieldAlert, ShieldCheck, Star } from 'lucide-react';
import { AdminManagedAgency } from '@/services/adminService';
import { PlanTier, Trip } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AdminCatalogSectionProps {
  agencies: AdminManagedAgency[];
  trips: Trip[];
  onAgencyControl: (
    agencyId: string,
    updates: { verified?: boolean; isActive?: boolean; subscriptionPlan?: PlanTier }
  ) => Promise<void>;
  onToggleFeatured: (trip: Trip) => Promise<void>;
}

export const AdminCatalogSection: React.FC<AdminCatalogSectionProps> = ({
  agencies,
  trips,
  onAgencyControl,
  onToggleFeatured,
}) => (
  <div className="space-y-8">
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
      <h2 className="font-serif text-xl font-bold text-stone-900">
        Agências, Agentes & Planos ({agencies.length})
      </h2>

      {agencies.length === 0 ? (
        <p className="text-sm text-stone-500">
          Nenhuma agência ou agente cadastrado no Firestore ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {agencies.map((ag) => (
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
                </div>
                <p className="text-sm font-semibold text-stone-900">
                  {ag.name} (/{ag.slug})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Plano de ${ag.name}`}
                  value={ag.subscriptionPlan}
                  onChange={(e) =>
                    void onAgencyControl(ag.id, {
                      subscriptionPlan: e.target.value as PlanTier,
                    })
                  }
                  className="min-h-[38px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="STARTER">Starter (Grátis)</option>
                  <option value="BASIC">Básico</option>
                  <option value="PREMIUM">Premium</option>
                </select>

                <Button
                  size="sm"
                  variant={ag.verified ? 'outline' : 'primary'}
                  onClick={() => void onAgencyControl(ag.id, { verified: !ag.verified })}
                >
                  {ag.verified ? 'Remover selo' : 'Verificar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {trips.length > 0 && (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-3">
        <h2 className="font-serif text-xl font-bold text-stone-900">
          Curadoria de Destaques ({trips.length})
        </h2>
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3.5"
          >
            <div>
              <p className="text-sm font-semibold text-stone-900">{trip.title}</p>
              <p className="text-xs text-stone-500">
                {trip.agencyName} · {trip.destination}
              </p>
            </div>
            <Button
              size="sm"
              variant={trip.featured ? 'primary' : 'outline'}
              leftIcon={<Star size={14} />}
              onClick={() => void onToggleFeatured(trip)}
            >
              {trip.featured ? 'Em destaque' : 'Destacar na Home'}
            </Button>
          </div>
        ))}
      </section>
    )}
  </div>
);
