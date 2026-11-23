import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createTripInFirestore, updateTripInFirestore } from '@/services/tripService';
import { Agency, Trip, TripDeparture } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { slugify } from '@/utils/slugUtils';
import { useToast } from '@/context/ToastContext';
import { TripFormFields, TripFormState } from './TripFormFields';

interface TripCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
  canPublishMoreTrips?: boolean;
  editingTrip?: Trip | null;
  onCreated: (trip: Trip) => void;
  onUpdated?: (trip: Trip) => void;
}

const DEFAULT_COVER_URL =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';

const toDateInputValue = (iso?: string): string => {
  const parsed = iso ? new Date(iso) : new Date(Date.now() + 7 * 86400000);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
};

function buildInitialState(editingTrip?: Trip | null): TripFormState {
  if (!editingTrip) {
    return {
      title: '',
      destination: '',
      latitude: '',
      longitude: '',
      price: '1290',
      durationDays: '3',
      maxGuests: '16',
      startDate: toDateInputValue(),
      departures: [],
      boardingPoints: [{ id: 'bp-1', time: '07:00', location: '' }],
      allowChildren: true,
      category: 'NATUREZA',
      imageUrl: DEFAULT_COVER_URL,
      extraImagesText: '',
      includedText: 'Guia credenciado SouNativo, Seguro viagem',
      notIncludedText: 'Despesas pessoais',
      itinerary: [],
      description: '',
    };
  }

  const safeImages = Array.isArray(editingTrip.images) ? editingTrip.images.filter(Boolean) : [];
  const safeBoarding = Array.isArray(editingTrip.boardingPoints) ? editingTrip.boardingPoints : [];
  const safeItinerary = Array.isArray(editingTrip.itinerary) ? editingTrip.itinerary : [];
  const safeDepartures = Array.isArray(editingTrip.departures)
    ? editingTrip.departures.map((dep, idx) => ({
        id: dep.id || `dep-${idx + 1}`,
        startDate: toDateInputValue(dep.startDate),
        maxGuests: String(dep.maxGuests || editingTrip.maxGuests || 16),
        availableSpots: dep.availableSpots,
        priceOverride: dep.priceOverride !== undefined ? String(dep.priceOverride) : '',
      }))
    : [];

  return {
    title: editingTrip.title ?? '',
    destination: editingTrip.destination ?? '',
    latitude: editingTrip.latitude !== undefined ? String(editingTrip.latitude) : '',
    longitude: editingTrip.longitude !== undefined ? String(editingTrip.longitude) : '',
    price: String(editingTrip.price ?? 0),
    durationDays: String(editingTrip.durationDays ?? 1),
    maxGuests: String(editingTrip.maxGuests || 16),
    startDate: toDateInputValue(editingTrip.startDate),
    departures: safeDepartures,
    boardingPoints:
      safeBoarding.length > 0 ? safeBoarding : [{ id: 'bp-1', time: '07:00', location: '' }],
    allowChildren: editingTrip.passengerConfig?.allowChildren ?? true,
    category: editingTrip.category ?? 'NATUREZA',
    imageUrl: safeImages[0] || DEFAULT_COVER_URL,
    extraImagesText: safeImages.slice(1).join(', '),
    includedText: (editingTrip.included ?? []).join(', '),
    notIncludedText: (editingTrip.notIncluded ?? []).join(', '),
    itinerary: safeItinerary,
    description: editingTrip.description ?? '',
  };
}

export const TripCreateModal: React.FC<TripCreateModalProps> = ({
  isOpen,
  onClose,
  agency,
  canPublishMoreTrips = true,
  editingTrip,
  onCreated,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const [values, setValues] = useState<TripFormState>(() => buildInitialState(editingTrip));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(buildInitialState(editingTrip));
    }
  }, [editingTrip, isOpen]);

  const handleFieldChange = <K extends keyof TripFormState>(field: K, value: TripFormState[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip && !canPublishMoreTrips) {
      showToast(
        'Limite de roteiros ativos do seu plano atingido. Pause um pacote ou faça upgrade.',
        'info'
      );
      return;
    }
    setSaving(true);

    const parsedIncluded = values.includedText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedNotIncluded = values.notIncludedText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const extraImages = values.extraImagesText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));
    const cover = values.imageUrl.trim();
    const allImages = [
      ...(cover && /^https?:\/\//i.test(cover) ? [cover] : [DEFAULT_COVER_URL]),
      ...extraImages,
    ].slice(0, 20);

    const durationDays = Math.max(1, Number(values.durationDays) || 1);
    const maxGuests = Math.max(1, Number(values.maxGuests) || 16);
    const numericPrice = Math.max(0, Number(values.price) || 0);
    const rawStart = new Date(`${values.startDate}T08:00:00Z`);
    const startObj = Number.isNaN(rawStart.getTime())
      ? new Date(Date.now() + 7 * 86400000)
      : rawStart;
    const endObj = new Date(startObj.getTime() + Math.max(0, durationDays - 1) * 86400000);

    const parsedLat = values.latitude.trim() !== '' ? Number(values.latitude) : NaN;
    const latitude =
      Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : undefined;

    const parsedLng = values.longitude.trim() !== '' ? Number(values.longitude) : NaN;
    const longitude =
      Number.isFinite(parsedLng) && parsedLng >= -180 && parsedLng <= 180 ? parsedLng : undefined;

    const departures: TripDeparture[] = (values.departures ?? [])
      .map((dep, idx) => {
        const depStartRaw = new Date(`${dep.startDate}T08:00:00Z`);
        if (Number.isNaN(depStartRaw.getTime())) return null;
        const depEndRaw = new Date(
          depStartRaw.getTime() + Math.max(0, durationDays - 1) * 86400000
        );
        const depMax = Math.max(1, Math.round(Number(dep.maxGuests) || maxGuests));
        const prevDep = editingTrip?.departures?.find((d) => d.id === dep.id);
        const depAvail =
          dep.availableSpots !== undefined
            ? prevDep
              ? Math.min(
                  depMax,
                  Math.max(
                    0,
                    dep.availableSpots +
                      (depMax - Math.max(1, prevDep.maxGuests || editingTrip?.maxGuests || maxGuests))
                  )
                )
              : Math.min(depMax, Math.max(0, dep.availableSpots))
            : depMax;
        const priceCandidate =
          dep.priceOverride.trim() !== '' ? Number(dep.priceOverride) : undefined;
        const priceOverride =
          priceCandidate !== undefined && Number.isFinite(priceCandidate) && priceCandidate >= 0
            ? priceCandidate
            : undefined;

        return {
          id: dep.id || `dep-${idx + 1}`,
          startDate: depStartRaw.toISOString(),
          endDate: depEndRaw.toISOString(),
          maxGuests: depMax,
          availableSpots: depAvail,
          ...(priceOverride !== undefined ? { priceOverride } : {}),
        };
      })
      .filter((item): item is TripDeparture => item !== null)
      .slice(0, 30);

    const boardingPoints = (values.boardingPoints ?? [])
      .map((bp, idx) => ({
        id: bp.id || `bp-${idx + 1}`,
        time: bp.time || '07:00',
        location: bp.location.trim(),
      }))
      .filter((bp) => bp.location.length > 0)
      .slice(0, 30);

    const itinerary = (values.itinerary ?? [])
      .map((d, idx) => ({
        day: idx + 1,
        title: d.title.trim() || `Dia ${idx + 1}`,
        description: d.description.trim(),
      }))
      .filter((d) => d.title.length > 0 || d.description.length > 0)
      .slice(0, 60);

    const passengerConfig = {
      allowChildren: values.allowChildren,
      childAgeLimit: 12,
      childPriceMultiplier: values.allowChildren ? 0.7 : 1,
    };

    try {
      if (editingTrip) {
        const prevMax = editingTrip.maxGuests || maxGuests;
        const prevAvail = editingTrip.availableSpots ?? prevMax;
        const nextAvail = Math.max(0, prevAvail + (maxGuests - prevMax));

        const updates = {
          title: values.title.trim(),
          destination: values.destination.trim(),
          ...(latitude !== undefined ? { latitude } : {}),
          ...(longitude !== undefined ? { longitude } : {}),
          price: numericPrice,
          durationDays,
          startDate: startObj.toISOString(),
          endDate: endObj.toISOString(),
          maxGuests,
          availableSpots: nextAvail,
          departures,
          category: values.category,
          tags: [CATEGORY_LABELS[values.category] ?? 'Experiência'],
          images: allImages,
          itinerary,
          boardingPoints,
          passengerConfig,
          included: parsedIncluded.length > 0 ? parsedIncluded : ['Guia credenciado SouNativo'],
          notIncluded: parsedNotIncluded.length > 0 ? parsedNotIncluded : ['Despesas pessoais'],
          description: values.description.trim(),
        };
        await updateTripInFirestore(editingTrip.id, updates);
        onUpdated?.({ ...editingTrip, ...updates });
        showToast('Pacote atualizado no Firestore!', 'success');
      } else {
        const baseSlug = slugify(values.title) || 'roteiro';
        const slug = `${baseSlug.slice(0, 160)}-${Date.now().toString(36).slice(-4)}`;
        const created = await createTripInFirestore({
          agencyId: agency.id,
          agencyName: agency.name,
          agencySlug: agency.slug,
          title: values.title.trim(),
          slug,
          description: values.description.trim(),
          destination: values.destination.trim(),
          ...(latitude !== undefined ? { latitude } : {}),
          ...(longitude !== undefined ? { longitude } : {}),
          price: numericPrice,
          startDate: startObj.toISOString(),
          endDate: endObj.toISOString(),
          durationDays,
          images: allImages,
          category: values.category,
          tags: [CATEGORY_LABELS[values.category] ?? 'Experiência'],
          travelerTypes: ['CASAL', 'AMIGOS'],
          itinerary,
          boardingPoints,
          ...(departures.length > 0 ? { departures } : {}),
          paymentMethods: ['Pix', 'Cartão de Crédito'],
          included: parsedIncluded.length > 0 ? parsedIncluded : ['Guia credenciado SouNativo'],
          notIncluded: parsedNotIncluded.length > 0 ? parsedNotIncluded : ['Despesas pessoais'],
          maxGuests,
          availableSpots: maxGuests,
          passengerConfig,
          rating: 0,
          totalReviews: 0,
          featured: false,
          isActive: true,
        });
        onCreated(created);
        showToast('Pacote publicado com sucesso no Firestore!', 'success');
      }
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar pacote.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTrip ? 'Editar Experiência' : 'Publicar Nova Experiência'}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <TripFormFields values={values} onChange={handleFieldChange} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {editingTrip ? 'Salvar alterações' : 'Publicar roteiro'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
