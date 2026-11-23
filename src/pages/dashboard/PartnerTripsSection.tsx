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
  canPublishMoreTrips?: boolean;
  onEdit: (trip: Trip) => void;
  onTripUpdated: (trip: Trip) => void;
  onTripDeleted: (tripId: string) => void;
}

export const PartnerTripsSection: React.FC<PartnerTripsSectionProps> = ({
  trips,
  canPublishMoreTrips = true,
  onEdit,
  onTripUpdated,
  onTripDeleted,
}) => {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleToggleActive = async (trip: Trip) => {
    const nextActive = !trip.isActive;
    if (nextActive && !canPublishMoreTrips) {
      showToast(
        'Limite de roteiros ativos do plano atingido. Pause outro roteiro ou faça upgrade na aba Plano & Assinatura.',
        'info'
      );
      return;
    }

    setBusyId(trip.id);
    try {
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
      setConfirmDeleteId(null);
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
              className="rounded-xl border border-stone-200 p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    {formatCurrencyBRL(trip.price)} · {trip.durationDays} dia(s) ·{' '}
                    {trip.availableSpots ?? trip.maxGuests}/{trip.maxGuests} vagas livres
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
                    onClick={() =>
                      setConfirmDeleteId(confirmDeleteId === trip.id ? null : trip.id)
                    }
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </Button>
                </div>
              </div>

              {confirmDeleteId === trip.id && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
                  <span>Confirmar exclusão permanente de &ldquo;{trip.title}&rdquo;?</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === trip.id}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busyId === trip.id}
                      onClick={() => void handleDelete(trip)}
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
  );
};
