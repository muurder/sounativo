import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import {
  AdminManagedAgency,
  AdminManagedUser,
  fetchAllAgenciesForAdmin,
  fetchAllTripsForAdmin,
  fetchAllUsersForAdmin,
  toggleTripFeaturedAsAdmin,
  updateAgencyAdminControls,
  updateUserRoleAsAdmin,
} from '@/services/adminService';
import { PlanTier, Trip, UserRole } from '@/types';
import { useToast } from '@/context/ToastContext';
import { AdminCatalogSection } from './AdminCatalogSection';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'CLIENT', label: 'Viajante / Cliente' },
  { value: 'AGENCY', label: 'Agência de Turismo' },
  { value: 'GUIDE', label: 'Guia / Agente de Turismo' },
  { value: 'ADMIN', label: 'Administrador Master' },
];

export const AdminDashboardView: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [agencies, setAgencies] = useState<AdminManagedAgency[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([fetchAllUsersForAdmin(), fetchAllAgenciesForAdmin(), fetchAllTripsForAdmin()])
      .then(([u, a, t]) => {
        setUsers(u);
        setAgencies(a);
        setTrips(t);
      })
      .catch((err) => {
        showToast(
          err instanceof Error
            ? err.message
            : 'Sem permissão Admin no Firestore. Publique as rules atualizadas.',
          'error'
        );
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await updateUserRoleAsAdmin(uid, role);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
      showToast(`Papel atualizado para ${role}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar papel.', 'error');
    }
  };

  const handleAgencyControl = async (
    agencyId: string,
    updates: { verified?: boolean; isActive?: boolean; subscriptionPlan?: PlanTier }
  ) => {
    try {
      await updateAgencyAdminControls(agencyId, updates);
      setAgencies((prev) => prev.map((a) => (a.id === agencyId ? { ...a, ...updates } : a)));
      showToast('Parceiro atualizado pelo Admin!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar agência.', 'error');
    }
  };

  const handleToggleFeatured = async (trip: Trip) => {
    try {
      const next = !trip.featured;
      await toggleTripFeaturedAsAdmin(trip.id, next);
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? { ...t, featured: next } : t)));
      showToast(next ? 'Roteiro destacado na Home!' : 'Removido dos destaques.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar destaque.', 'error');
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Carregando console administrativo...</p>;
  }

  const normalized = search.trim().toLowerCase();
  const visibleUsers = normalized
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(normalized) || u.email.toLowerCase().includes(normalized)
      )
    : users;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary-600" />
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Usuários & Definição de Papéis ({users.length})
            </h2>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome ou e-mail..."
            className="min-h-[40px] w-full sm:w-64 rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div className="space-y-2.5">
          {visibleUsers.map((account) => (
            <div
              key={account.uid}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-stone-200 p-3.5"
            >
              <div>
                <p className="text-sm font-semibold text-stone-900">{account.name}</p>
                <p className="text-xs text-stone-500">
                  {account.email} · UID: {account.uid.slice(0, 8)}...
                </p>
              </div>
              <select
                aria-label={`Papel de ${account.name}`}
                value={account.role}
                onChange={(e) => void handleRoleChange(account.uid, e.target.value as UserRole)}
                className="min-h-[40px] rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-800"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <AdminCatalogSection
        agencies={agencies}
        trips={trips}
        onAgencyControl={handleAgencyControl}
        onToggleFeatured={handleToggleFeatured}
      />
    </div>
  );
};
