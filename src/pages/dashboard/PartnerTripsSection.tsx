import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Trip } from '@/types';
import { deleteTripInFirestore, updateTripInFirestore } from '@/services/tripService';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface PartnerTripsSectionProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onTripUpdated: (trip: Trip) => void;
  onTripDeleted: (tripId: string) => void;
}

export const PartnerTripsSection: React.FC<PartnerTripsSectionProps> = ({
  trips,
  onEdit,
  onTripUpdated,
  onTripDeleted,
}) => {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleToggleActive = async (trip: Trip) => {
    setBusyId(trip.id);
    try {
      const nextActive = !trip.isActive;
      await updateTripInFirestore(trip.id, { isActive: nextActive });
      onTripUpdated({ ...trip, isActive: nextActive });
      showToast(nextActive ? 'Roteiro reativado na vitrine.' : 'Roteiro pausado.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (trip: Trip) => {
    setBusyId(trip.id);
    try {
      await deleteTripInFirestore(trip.id);
      onTripDeleted(trip.id);
      showToast(`Roteiro "${trip.title}" excluído.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir roteiro.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-stone-900">
          Meus Roteiros ({trips.length})
        </h3>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-stone-500">
          Você ainda não publicou nenhum roteiro. Clique em &ldquo;Novo Pacote&rdquo; acima para
          estrear na vitrine.
        </p>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={trip.isActive ? 'success' : 'warning'}>
                    {trip.isActive ? 'Ativo' : 'Pausado'}
                  </Badge>
                  <span className="text-xs text-stone-500">{trip.destination}</span>
                </div>
                <Link
                  to={`/viagem/${trip.slug}`}
                  className="block font-semibold text-sm text-stone-900 hover:text-primary-600 truncate"
                >
                  {trip.title}
                </Link>
                <p className="text-xs text-stone-600">
                  {formatCurrencyBRL(trip.price)} · {trip.durationDays} dia(s) · máx.{' '}
                  {trip.maxGuests} vagas
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Pencil size={14} />}
                  disabled={busyId === trip.id}
                  onClick={() => onEdit(trip)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={trip.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  loading={busyId === trip.id}
                  onClick={() => void handleToggleActive(trip)}
                >
                  {trip.isActive ? 'Pausar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Excluir ${trip.title}`}
                  disabled={busyId === trip.id}
                  onClick={() => void handleDelete(trip)}
                >
                  <Trash2 size={14} className="text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
