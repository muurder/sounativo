import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createTripInFirestore, updateTripInFirestore } from '@/services/tripService';
import { Agency, Trip } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { slugify } from '@/utils/slugUtils';
import { useToast } from '@/context/ToastContext';
import { TripFormFields, TripFormState } from './TripFormFields';

interface TripCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
  editingTrip?: Trip | null;
  onCreated: (trip: Trip) => void;
  onUpdated?: (trip: Trip) => void;
}

const DEFAULT_COVER_URL =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';

const toDateInputValue = (iso?: string): string => {
  const parsed = iso ? new Date(iso) : new Date(Date.now() + 7 * 86400000);
  if (Number.isNaN(parsed.getTime()))
    return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

function buildInitialState(editingTrip?: Trip | null): TripFormState {
  if (!editingTrip) {
    return {
      title: '',
      destination: '',
      price: '1290',
      durationDays: '3',
      maxGuests: '16',
      startDate: toDateInputValue(),
      boardingTime: '07:00',
      boardingLocation: '',
      allowChildren: true,
      category: 'NATUREZA',
      imageUrl: DEFAULT_COVER_URL,
      includedText: 'Guia credenciado SouNativo, Seguro viagem',
      notIncludedText: 'Despesas pessoais',
      description: '',
    };
  }
  const primaryBoarding = editingTrip.boardingPoints[0];
  return {
    title: editingTrip.title,
    destination: editingTrip.destination,
    price: String(editingTrip.price),
    durationDays: String(editingTrip.durationDays),
    maxGuests: String(editingTrip.maxGuests || 16),
    startDate: toDateInputValue(editingTrip.startDate),
    boardingTime: primaryBoarding?.time ?? '07:00',
    boardingLocation: primaryBoarding?.location ?? '',
    allowChildren: editingTrip.passengerConfig.allowChildren,
    category: editingTrip.category,
    imageUrl: editingTrip.images[0] || DEFAULT_COVER_URL,
    includedText: editingTrip.included.join(', '),
    notIncludedText: editingTrip.notIncluded.join(', '),
    description: editingTrip.description,
  };
}

export const TripCreateModal: React.FC<TripCreateModalProps> = ({
  isOpen,
  onClose,
  agency,
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
    setSaving(true);

    const parsedIncluded = values.includedText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedNotIncluded = values.notIncludedText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const images = values.imageUrl.trim() ? [values.imageUrl.trim()] : [];
    const durationDays = Math.max(1, Number(values.durationDays));
    const maxGuests = Math.max(1, Number(values.maxGuests));
    const numericPrice = Math.max(0, Number(values.price));
    const startObj = new Date(`${values.startDate}T08:00:00Z`);
    const endObj = new Date(startObj.getTime() + durationDays * 86400000);
    const boardingPoints = values.boardingLocation.trim()
      ? [
          {
            id: 'bp-1',
            time: values.boardingTime || '07:00',
            location: values.boardingLocation.trim(),
          },
        ]
      : [];
    const passengerConfig = {
      allowChildren: values.allowChildren,
      childAgeLimit: 12,
      childPriceMultiplier: values.allowChildren ? 0.7 : 1,
    };

    try {
      if (editingTrip) {
        const updates = {
          title: values.title.trim(),
          destination: values.destination.trim(),
          price: numericPrice,
          durationDays,
          startDate: startObj.toISOString(),
          endDate: endObj.toISOString(),
          maxGuests,
          category: values.category,
          tags: [CATEGORY_LABELS[values.category]],
          images,
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
        const slug = `${slugify(values.title)}-${Date.now().toString(36).slice(-4)}`;
        const created = await createTripInFirestore({
          agencyId: agency.id,
          agencyName: agency.name,
          agencySlug: agency.slug,
          title: values.title.trim(),
          slug,
          description: values.description.trim(),
          destination: values.destination.trim(),
          price: numericPrice,
          startDate: startObj.toISOString(),
          endDate: endObj.toISOString(),
          durationDays,
          images,
          category: values.category,
          tags: [CATEGORY_LABELS[values.category]],
          travelerTypes: ['CASAL', 'AMIGOS'],
          itinerary: [],
          boardingPoints,
          paymentMethods: ['Pix', 'Cartão de Crédito'],
          included: parsedIncluded.length > 0 ? parsedIncluded : ['Guia credenciado SouNativo'],
          notIncluded: parsedNotIncluded.length > 0 ? parsedNotIncluded : ['Despesas pessoais'],
          maxGuests,
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
