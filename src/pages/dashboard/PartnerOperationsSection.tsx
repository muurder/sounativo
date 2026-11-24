import React, { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  Bus,
  Download,
  MapPin,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Booking,
  OperationalManualPassenger,
  OperationalRoom,
  OperationalVehicle,
  Trip,
  TripOperationalData,
} from '@/types';
import { updateTripInFirestore } from '@/services/tripService';
import { formatShortDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { useToast } from '@/context/ToastContext';

interface PartnerOperationsSectionProps {
  trips: Trip[];
  bookings: Booking[];
  isGuide?: boolean;
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onTripUpdated: (trip: Trip) => void;
}

const VEHICLE_PRESETS: Array<{
  type: OperationalVehicle['type'];
  label: string;
  capacity: number;
}> = [
  { type: 'VAN', label: 'Van Executiva (15 lugares)', capacity: 15 },
  { type: 'MICROBUS', label: 'Micro-ônibus (28 lugares)', capacity: 28 },
  { type: 'BUS', label: 'Ônibus Executivo (46 lugares)', capacity: 46 },
  { type: 'SUV', label: 'SUV / 4x4 Expedição (4 lugares)', capacity: 4 },
];

const ROOM_PRESETS: Array<{
  type: OperationalRoom['type'];
  label: string;
  capacity: number;
}> = [
  { type: 'DOUBLE', label: 'Quarto Duplo / Casal (2 vagas)', capacity: 2 },
  { type: 'TRIPLE', label: 'Quarto Triplo (3 vagas)', capacity: 3 },
  { type: 'QUAD', label: 'Quarto Quádruplo (4 vagas)', capacity: 4 },
  { type: 'SINGLE', label: 'Quarto Individual (1 vaga)', capacity: 1 },
  { type: 'SHARED', label: 'Chalé / Compartilhado (6 vagas)', capacity: 6 },
];

export const PartnerOperationsSection: React.FC<PartnerOperationsSectionProps> = ({
  trips,
  bookings,
  isGuide = false,
  selectedTripId,
  onSelectTrip,
  onTripUpdated,
}) => {
  const { showToast } = useToast();
  const itemLabelLower = isGuide ? 'experiência' : 'pacote';

  const selectedTrip = useMemo(
    () => trips.find((t) => t.id === selectedTripId) ?? trips[0] ?? null,
    [selectedTripId, trips]
  );

  const [subTab, setSubTab] = useState<'TRANSPORT' | 'ROOMING' | 'PASSENGERS'>('TRANSPORT');
  const [vehicles, setVehicles] = useState<OperationalVehicle[]>([]);
  const [rooms, setRooms] = useState<OperationalRoom[]>([]);
  const [manualPassengers, setManualPassengers] = useState<OperationalManualPassenger[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Manual passenger form state
  const [newPaxName, setNewPaxName] = useState('');
  const [newPaxDoc, setNewPaxDoc] = useState('');
  const [newPaxPhone, setNewPaxPhone] = useState('');
  const [newPaxBoarding, setNewPaxBoarding] = useState('');

  // Seat assignment selector
  const [selectedPassengerForSeat, setSelectedPassengerForSeat] = useState<string>('');

  useEffect(() => {
    if (!selectedTrip) return;
    const op = selectedTrip.operationalData;
    setVehicles(Array.isArray(op?.vehicles) ? op.vehicles : []);
    setRooms(Array.isArray(op?.rooms) ? op.rooms : []);
    setManualPassengers(Array.isArray(op?.manualPassengers) ? op.manualPassengers : []);
    setNotes(op?.notes ?? '');
  }, [selectedTrip]);

  const tripBookings = useMemo(() => {
    if (!selectedTrip) return [];
    return bookings.filter((b) => b.tripId === selectedTrip.id && b.status !== 'CANCELLED');
  }, [bookings, selectedTrip]);

  const allPassengers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      document: string;
      phone: string;
      source: string;
      status: string;
    }> = [];

    for (const b of tripBookings) {
      const paxDetails = Array.isArray(b.passengerDetails) ? b.passengerDetails : [];
      if (paxDetails.length > 0) {
        paxDetails.forEach((p, idx) => {
          list.push({
            id: `${b.id}-pax-${idx}`,
            name: p.name || b.clientName || `Passageiro ${idx + 1}`,
            document: p.document || '—',
            phone: p.phone || '—',
            source: `Voucher ${b.voucherCode}`,
            status: b.status,
          });
        });
      } else {
        const count = (b.adults ?? 1) + (b.children ?? 0);
        for (let i = 0; i < count; i++) {
          list.push({
            id: `${b.id}-pax-${i}`,
            name: i === 0 ? b.clientName || 'Titular' : `${b.clientName || 'Titular'} (Acomp. ${i})`,
            document: '—',
            phone: '—',
            source: `Voucher ${b.voucherCode}`,
            status: b.status,
          });
        }
      }
    }

    for (const mp of manualPassengers) {
      list.push({
        id: mp.id,
        name: mp.name,
        document: mp.document || '—',
        phone: mp.phone || '—',
        source: mp.boardingLocation ? `Manual (${mp.boardingLocation})` : 'Cadastro Manual',
        status: 'CONFIRMED',
      });
    }

    return list;
  }, [manualPassengers, tripBookings]);

  useEffect(() => {
    if (!selectedPassengerForSeat && allPassengers.length > 0) {
      setSelectedPassengerForSeat(allPassengers[0].name);
    }
  }, [allPassengers, selectedPassengerForSeat]);

  if (trips.length === 0 || !selectedTrip) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-card space-y-2">
        <Bus size={36} className="mx-auto text-stone-300" />
        <h3 className="font-serif text-xl font-bold text-stone-900">Módulo Operacional</h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          Publique seu primeiro {itemLabelLower} para gerenciar veículos, mapa de assentos, divisão
          de quartos (rooming list) e manifesto de embarque.
        </p>
      </section>
    );
  }

  const handleAddVehicle = (preset: (typeof VEHICLE_PRESETS)[number]) => {
    const nextIdx = vehicles.length + 1;
    setVehicles((prev) => [
      ...prev,
      {
        id: `veh-${Date.now().toString(36)}-${nextIdx}`,
        name: `${preset.label.split(' (')[0]} #${nextIdx}`,
        type: preset.type,
        capacity: preset.capacity,
        seats: [],
      },
    ]);
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  };

  const handleToggleSeat = (vehicleId: string, seatNumber: number) => {
    setVehicles((prev) =>
      prev.map((veh) => {
        if (veh.id !== vehicleId) return veh;
        const existing = veh.seats.find((s) => s.seatNumber === seatNumber);
        if (existing) {
          return {
            ...veh,
            seats: veh.seats.filter((s) => s.seatNumber !== seatNumber),
          };
        }
        const paxName = selectedPassengerForSeat.trim() || `Passageiro Assento ${seatNumber}`;
        return {
          ...veh,
          seats: [...veh.seats, { seatNumber, passengerName: paxName }],
        };
      })
    );
  };

  const handleAddRoom = (preset: (typeof ROOM_PRESETS)[number]) => {
    const nextIdx = rooms.length + 1;
    setRooms((prev) => [
      ...prev,
      {
        id: `room-${Date.now().toString(36)}-${nextIdx}`,
        name: `${preset.label.split(' (')[0]} ${100 + nextIdx}`,
        type: preset.type,
        capacity: preset.capacity,
        guests: [],
      },
    ]);
  };

  const handleRemoveRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  const handleAddGuestToRoom = (roomId: string, guestName: string) => {
    if (!guestName.trim()) return;
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        if (room.guests.length >= room.capacity) return room;
        if (room.guests.includes(guestName)) return room;
        return { ...room, guests: [...room.guests, guestName] };
      })
    );
  };

  const handleRemoveGuestFromRoom = (roomId: string, guestIdx: number) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, guests: room.guests.filter((_, idx) => idx !== guestIdx) }
          : room
      )
    );
  };

  const handleAddManualPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaxName.trim()) return;
    const added: OperationalManualPassenger = {
      id: `mp-${Date.now().toString(36)}`,
      name: newPaxName.trim(),
      ...(newPaxDoc.trim() ? { document: newPaxDoc.trim() } : {}),
      ...(newPaxPhone.trim() ? { phone: newPaxPhone.trim() } : {}),
      ...(newPaxBoarding.trim() ? { boardingLocation: newPaxBoarding.trim() } : {}),
    };
    setManualPassengers((prev) => [...prev, added]);
    setNewPaxName('');
    setNewPaxDoc('');
    setNewPaxPhone('');
    setNewPaxBoarding('');
    showToast('Passageiro adicionado à lista operacional.', 'success');
  };

  const handleRemoveManualPassenger = (id: string) => {
    setManualPassengers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveOperationalData = async () => {
    setSaving(true);
    const operationalData: TripOperationalData = {
      vehicles,
      rooms,
      manualPassengers,
      notes: notes.trim(),
    };
    try {
      await updateTripInFirestore(selectedTrip.id, { operationalData });
      onTripUpdated({ ...selectedTrip, operationalData });
      showToast('Mapa operacional salvo com sucesso!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao salvar dados operacionais.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExportOperationalManifest = () => {
    const getSeatLabel = (paxName: string) => {
      for (const v of vehicles) {
        const seat = v.seats.find((s) => s.passengerName === paxName);
        if (seat) return `${v.name} - Assento ${seat.seatNumber}`;
      }
      return 'Sem assento atribuído';
    };

    const getRoomLabel = (paxName: string) => {
      for (const r of rooms) {
        if (r.guests.includes(paxName)) return r.name;
      }
      return 'Sem quarto atribuído';
    };

    const rows: string[][] = [
      [
        'Roteiro',
        'Destino',
        'Saida',
        'Passageiro',
        'Documento',
        'Telefone',
        'Origem/Voucher',
        'Transporte/Assento',
        'Hospedagem/Quarto',
      ],
    ];

    for (const p of allPassengers) {
      rows.push([
        selectedTrip.title,
        selectedTrip.destination,
        formatShortDate(selectedTrip.startDate),
        p.name,
        p.document,
        p.phone,
        p.source,
        getSeatLabel(p.name),
        getRoomLabel(p.name),
      ]);
    }

    const csv =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manifesto-operacional-${selectedTrip.slug}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Manifesto operacional (CSV) exportado!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Trip Selector */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {selectedTrip.images?.[0] && (
              <div className="h-14 w-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 hidden sm:block">
                <SafeImage
                  src={selectedTrip.images[0]}
                  alt={selectedTrip.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={selectedTrip.isActive ? 'success' : 'warning'}>
                  {selectedTrip.isActive ? 'Ativo' : 'Pausado'}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                  <MapPin size={12} className="text-primary-600" />
                  {selectedTrip.destination} · Saída {formatShortDate(selectedTrip.startDate)}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Operacional: {selectedTrip.title}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={`Selecionar ${itemLabelLower} para gestão operacional`}
              value={selectedTrip.id}
              onChange={(e) => onSelectTrip(e.target.value)}
              className="min-h-[40px] rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-800"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({formatShortDate(t.startDate)})
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download size={14} />}
              onClick={handleExportOperationalManifest}
            >
              Exportar Manifesto
            </Button>

            <Button
              size="sm"
              loading={saving}
              leftIcon={<Save size={14} />}
              onClick={() => void handleSaveOperationalData()}
            >
              Salvar Operacional
            </Button>
          </div>
        </div>

        {/* Sub-Tabs: Transporte, Hospedagem, Passageiros */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSubTab('TRANSPORT')}
              className={`inline-flex items-center gap-2 min-h-[38px] rounded-xl px-4 text-xs font-semibold transition-colors ${
                subTab === 'TRANSPORT'
                  ? 'bg-primary-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Bus size={15} /> Transporte &amp; Assentos ({vehicles.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('ROOMING')}
              className={`inline-flex items-center gap-2 min-h-[38px] rounded-xl px-4 text-xs font-semibold transition-colors ${
                subTab === 'ROOMING'
                  ? 'bg-primary-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <BedDouble size={15} /> Hospedagem / Quartos ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('PASSENGERS')}
              className={`inline-flex items-center gap-2 min-h-[38px] rounded-xl px-4 text-xs font-semibold transition-colors ${
                subTab === 'PASSENGERS'
                  ? 'bg-primary-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Users size={15} /> Lista de Passageiros ({allPassengers.length})
            </button>
          </div>

          <span className="text-xs font-semibold text-stone-500">
            {allPassengers.length} passageiro(s) no manifesto
          </span>
        </div>
      </div>

      {/* SUB-TAB 1: TRANSPORT & SEAT MAP */}
      {subTab === 'TRANSPORT' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Frota &amp; Mapa de Assentos
                </h3>
                <p className="text-xs text-stone-500">
                  Adicione um veículo, selecione o passageiro abaixo e clique no número do assento
                  para alocar ou liberar.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VEHICLE_PRESETS.map((preset) => (
                  <Button
                    key={preset.type}
                    size="sm"
                    variant="outline"
                    leftIcon={<Plus size={13} />}
                    onClick={() => handleAddVehicle(preset)}
                  >
                    + {preset.label.split(' (')[0]}
                  </Button>
                ))}
              </div>
            </div>

            {allPassengers.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-stone-50 border border-stone-200 p-3">
                <span className="text-xs font-semibold text-stone-700">
                  Passageiro selecionado para alocar no assento:
                </span>
                <select
                  value={selectedPassengerForSeat}
                  onChange={(e) => setSelectedPassengerForSeat(e.target.value)}
                  className="min-h-[36px] rounded-lg border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-900"
                >
                  {allPassengers.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.source})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {vehicles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-500">
                Nenhum veículo configurado para este {itemLabelLower}. Clique em &ldquo;+ Van
                Executiva&rdquo; ou &ldquo;+ Ônibus Executivo&rdquo; acima para abrir o mapa de
                assentos.
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((veh) => (
                  <div
                    key={veh.id}
                    className="rounded-xl border border-stone-200 p-4 space-y-3 bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">{veh.name}</h4>
                        <p className="text-xs text-stone-500">
                          {veh.seats.length} de {veh.capacity} assentos ocupados
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveVehicle(veh.id)}
                      >
                        <Trash2 size={14} className="text-red-600 mr-1" /> Remover veículo
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {Array.from({ length: veh.capacity }, (_, i) => i + 1).map((seatNum) => {
                        const occupied = veh.seats.find((s) => s.seatNumber === seatNum);
                        return (
                          <button
                            key={seatNum}
                            type="button"
                            onClick={() => handleToggleSeat(veh.id, seatNum)}
                            className={`rounded-xl border p-2.5 text-left transition-all ${
                              occupied
                                ? 'border-primary-500 bg-primary-50 text-primary-900'
                                : 'border-stone-200 bg-white text-stone-600 hover:border-primary-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span>Assento {seatNum}</span>
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  occupied ? 'bg-primary-600' : 'bg-stone-300'
                                }`}
                              />
                            </div>
                            <p className="mt-1 truncate text-[11px] font-medium">
                              {occupied ? occupied.passengerName : 'Livre'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ROOMING LIST / HOSPEDAGEM */}
      {subTab === 'ROOMING' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Divisão de Quartos (Rooming List)
              </h3>
              <p className="text-xs text-stone-500">
                Organize a distribuição de hospedagem dos viajantes por quarto ou chalé.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROOM_PRESETS.map((preset) => (
                <Button
                  key={preset.type}
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={13} />}
                  onClick={() => handleAddRoom(preset)}
                >
                  + {preset.label.split(' (')[0]}
                </Button>
              ))}
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-500">
              Nenhum quarto cadastrado ainda. Adicione quartos acima para montar a Rooming List da
              hospedagem.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="rounded-xl border border-stone-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{room.name}</h4>
                      <p className="text-xs text-stone-500">
                        Ocupação: {room.guests.length}/{room.capacity} hóspede(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(room.id)}
                      className="text-stone-400 hover:text-red-600"
                      aria-label={`Remover ${room.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {room.guests.length === 0 ? (
                      <p className="text-xs text-stone-400 italic">Quarto vazio</p>
                    ) : (
                      room.guests.map((guest, idx) => (
                        <div
                          key={`${guest}-${idx}`}
                          className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800"
                        >
                          <span>{guest}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGuestFromRoom(room.id, idx)}
                            className="text-stone-400 hover:text-red-600"
                          >
                            Remover
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {room.guests.length < room.capacity && allPassengers.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      <select
                        aria-label={`Adicionar hóspede em ${room.name}`}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddGuestToRoom(room.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="flex-1 min-h-[36px] rounded-lg border border-stone-300 bg-white px-2.5 text-xs"
                      >
                        <option value="">+ Alocar passageiro neste quarto...</option>
                        {allPassengers.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PASSENGERS & MANUAL ADDITION */}
      {subTab === 'PASSENGERS' && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddManualPassenger}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-3"
          >
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-primary-600" />
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Adicionar Passageiro Manual (Venda Direta / Balcão)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                value={newPaxName}
                onChange={(e) => setNewPaxName(e.target.value)}
                placeholder="Nome completo *"
                className="min-h-[40px] rounded-xl border border-stone-300 px-3 text-xs"
              />
              <input
                type="text"
                value={newPaxDoc}
                onChange={(e) => setNewPaxDoc(e.target.value)}
                placeholder="CPF ou RG"
                className="min-h-[40px] rounded-xl border border-stone-300 px-3 text-xs"
              />
              <input
                type="text"
                value={newPaxPhone}
                onChange={(e) => setNewPaxPhone(e.target.value)}
                placeholder="WhatsApp / Telefone"
                className="min-h-[40px] rounded-xl border border-stone-300 px-3 text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPaxBoarding}
                  onChange={(e) => setNewPaxBoarding(e.target.value)}
                  placeholder="Ponto de embarque"
                  className="flex-1 min-h-[40px] rounded-xl border border-stone-300 px-3 text-xs"
                />
                <Button type="submit" size="sm">
                  Adicionar
                </Button>
              </div>
            </div>
          </form>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-3">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Passageiros do Manifesto ({allPassengers.length})
            </h3>
            {allPassengers.length === 0 ? (
              <p className="text-xs text-stone-500">
                Nenhum passageiro confirmado ou cadastrado manualmente neste roteiro ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {allPassengers.map((pax) => {
                  const isManual = pax.id.startsWith('mp-');
                  return (
                    <div
                      key={pax.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-stone-900">{pax.name}</p>
                        <p className="text-stone-500">
                          Doc: {pax.document} · Tel: {pax.phone} · Origem: {pax.source}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={pax.status === 'CONFIRMED' ? 'success' : 'secondary'}>
                          {pax.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                        </Badge>
                        {isManual && (
                          <button
                            type="button"
                            onClick={() => handleRemoveManualPassenger(pax.id)}
                            className="text-red-600 hover:underline font-semibold"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
