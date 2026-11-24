import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  Calendar,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Agency, Trip } from '@/types';
import {
  createTripInFirestore,
  deleteTripInFirestore,
  updateTripInFirestore,
} from '@/services/tripService';
import { formatCurrencyBRL, formatShortDate } from '@/utils/formatters';
import { slugify } from '@/utils/slugUtils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { useToast } from '@/context/ToastContext';

interface PartnerTripsSectionProps {
  trips: Trip[];
  agency?: Agency;
  isGuide?: boolean;
  canPublishMoreTrips?: boolean;
  onCreateNew?: () => void;
  onEdit: (trip: Trip) => void;
  onOpenOperations?: (tripId: string) => void;
  onTripCreated?: (trip: Trip) => void;
  onTripUpdated: (trip: Trip) => void;
  onTripDeleted: (tripId: string) => void;
}

export const PartnerTripsSection: React.FC<PartnerTripsSectionProps> = ({
  trips,
  agency,
  isGuide = false,
  canPublishMoreTrips = true,
  onCreateNew,
  onEdit,
  onOpenOperations,
  onTripCreated,
  onTripUpdated,
  onTripDeleted,
}) => {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  const itemSingular = isGuide ? 'Experiência' : 'Pacote';
  const itemSingularLower = isGuide ? 'experiência' : 'pacote';
  const itemPlural = isGuide ? 'Minhas Experiências' : 'Meus Pacotes';

  const filteredTrips = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return trips.filter((t) => {
      if (statusFilter === 'ACTIVE' && !t.isActive) return false;
      if (statusFilter === 'PAUSED' && t.isActive) return false;
      if (!q) return true;
      return (
        (t.title ?? '').toLowerCase().includes(q) ||
        (t.destination ?? '').toLowerCase().includes(q)
      );
    });
  }, [searchTerm, statusFilter, trips]);

  const handleToggleActive = async (trip: Trip) => {
    const nextActive = !trip.isActive;
    if (nextActive && !canPublishMoreTrips) {
      showToast(
        `Limite de ${isGuide ? 'experiências ativas' : 'pacotes ativos'} do plano atingido. Pause outro roteiro ou faça upgrade na aba Plano & Assinatura.`,
        'info'
      );
      return;
    }

    setBusyId(trip.id);
    try {
      await updateTripInFirestore(trip.id, { isActive: nextActive });
      onTripUpdated({ ...trip, isActive: nextActive });
      showToast(
        nextActive ? `${itemSingular} publicado na vitrine.` : `${itemSingular} pausado.`,
        'info'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (trip: Trip) => {
    setBusyId(trip.id);
    try {
      const copyTitle = `${trip.title} (Cópia)`.slice(0, 160);
      const baseSlug = slugify(copyTitle) || 'roteiro';
      const slug = `${baseSlug.slice(0, 160)}-${Date.now().toString(36).slice(-4)}`;
      const created = await createTripInFirestore({
        agencyId: trip.agencyId || agency?.id || '',
        agencyName: trip.agencyName || agency?.name || 'Parceiro SouNativo',
        agencySlug: trip.agencySlug || agency?.slug || '',
        title: copyTitle,
        slug,
        description: trip.description,
        destination: trip.destination,
        ...(trip.latitude !== undefined ? { latitude: trip.latitude } : {}),
        ...(trip.longitude !== undefined ? { longitude: trip.longitude } : {}),
        price: trip.price,
        startDate: trip.startDate,
        endDate: trip.endDate,
        durationDays: trip.durationDays,
        images: trip.images,
        category: trip.category,
        tags: trip.tags,
        travelerTypes: trip.travelerTypes,
        itinerary: trip.itinerary,
        boardingPoints: trip.boardingPoints,
        ...(trip.departures ? { departures: trip.departures } : {}),
        paymentMethods: trip.paymentMethods,
        included: trip.included,
        notIncluded: trip.notIncluded,
        maxGuests: trip.maxGuests,
        availableSpots: trip.maxGuests,
        passengerConfig: trip.passengerConfig,
        rating: 0,
        totalReviews: 0,
        featured: false,
        isActive: false,
      });
      onTripCreated?.(created);
      showToast(`${itemSingular} duplicado como rascunho pausado!`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : `Erro ao duplicar ${itemSingularLower}.`,
        'error'
      );
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
      showToast(`${itemSingular} "${trip.title}" excluído.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir roteiro.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      {/* Toolbar: Title, Search, Filter, Grid/Table toggle, Create Button */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              {itemPlural} ({filteredTrips.length}/{trips.length})
            </h3>
            <p className="text-xs text-stone-500">
              Gerencie vitrine, estoque de vagas, duplicação rápida e logística operacional.
            </p>
          </div>

          {onCreateNew && (
            <Button
              size="sm"
              leftIcon={<Plus size={15} />}
              disabled={!canPublishMoreTrips}
              onClick={onCreateNew}
            >
              {isGuide ? 'Nova Experiência' : 'Novo Pacote'}
            </Button>
          )}
        </div>

        {trips.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Buscar ${itemSingularLower} ou destino...`}
                  className="w-full min-h-[36px] rounded-xl border border-stone-300 pl-8 pr-3 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL' as const, label: 'Todos' },
                  { id: 'ACTIVE' as const, label: 'Ativos' },
                  { id: 'PAUSED' as const, label: 'Pausados' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`min-h-[34px] rounded-xl px-3 text-xs font-semibold transition-colors ${
                      statusFilter === f.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1 self-start sm:self-auto">
              <button
                type="button"
                aria-label="Visualização em grade"
                onClick={() => setViewMode('GRID')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'GRID' ? 'bg-white text-primary-700 shadow-sm' : 'text-stone-500'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                aria-label="Visualização em tabela"
                onClick={() => setViewMode('TABLE')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'TABLE' ? 'bg-white text-primary-700 shadow-sm' : 'text-stone-500'
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-stone-800">
            Você ainda não publicou nenhum {itemSingularLower}.
          </p>
          <p className="text-xs text-stone-500">
            Clique em &ldquo;{isGuide ? 'Nova Experiência' : 'Novo Pacote'}&rdquo; acima para
            estrear na vitrine do SouNativo.
          </p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
          Nenhum {itemSingularLower} encontrado com os filtros selecionados.
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrips.map((trip) => {
            const cover =
              trip.images?.[0] ||
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80';
            const freeSpots = trip.availableSpots ?? trip.maxGuests;

            return (
              <div
                key={trip.id}
                className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card flex flex-col justify-between group hover:border-primary-300 transition-all"
              >
                <div>
                  <div className="relative h-44 bg-stone-100 overflow-hidden">
                    <SafeImage
                      src={cover}
                      alt={trip.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <Badge tone={trip.isActive ? 'success' : 'warning'}>
                        {trip.isActive ? 'Ativo na vitrine' : 'Pausado / Rascunho'}
                      </Badge>
                    </div>
                    <Link
                      to={`/viagem/${trip.slug}`}
                      title="Ver página pública"
                      className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-stone-800 shadow hover:bg-white hover:text-primary-600"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-primary-600" />
                        {trip.destination}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-primary-600" />
                        {formatShortDate(trip.startDate)} · {trip.durationDays}d
                      </span>
                    </div>

                    <Link
                      to={`/viagem/${trip.slug}`}
                      className="block font-serif text-lg font-bold text-stone-900 hover:text-primary-600 truncate"
                    >
                      {trip.title}
                    </Link>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-serif text-lg font-bold text-primary-700">
                        {formatCurrencyBRL(trip.price)}
                      </span>
                      <span className="text-xs font-semibold text-stone-600">
                        {freeSpots}/{trip.maxGuests} vagas livres
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-100 bg-stone-50/60 p-3.5 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Pencil size={13} />}
                      disabled={busyId === trip.id}
                      onClick={() => onEdit(trip)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Copy size={13} />}
                      loading={busyId === trip.id}
                      onClick={() => void handleDuplicate(trip)}
                    >
                      Duplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={trip.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                      loading={busyId === trip.id}
                      onClick={() => void handleToggleActive(trip)}
                    >
                      {trip.isActive ? 'Pausar' : 'Ativar'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenOperations && (
                      <button
                        type="button"
                        onClick={() => onOpenOperations(trip.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[34px] rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                      >
                        <Bus size={13} /> Operacional
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Excluir ${trip.title}`}
                      disabled={busyId === trip.id}
                      onClick={() =>
                        setConfirmDeleteId(confirmDeleteId === trip.id ? null : trip.id)
                      }
                      className="inline-flex items-center justify-center gap-1 min-h-[34px] px-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
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
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-card overflow-hidden">
          <div className="divide-y divide-stone-100">
            {filteredTrips.map((trip) => {
              const cover =
                trip.images?.[0] ||
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80';
              return (
                <div key={trip.id} className="p-4 space-y-3 hover:bg-stone-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <SafeImage
                          src={cover}
                          alt={trip.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
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
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
                        variant="outline"
                        leftIcon={<Copy size={14} />}
                        loading={busyId === trip.id}
                        onClick={() => void handleDuplicate(trip)}
                      >
                        Duplicar
                      </Button>
                      {onOpenOperations && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Bus size={14} />}
                          onClick={() => onOpenOperations(trip.id)}
                        >
                          Operacional
                        </Button>
                      )}
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
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
