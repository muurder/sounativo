import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createTripInFirestore } from '@/services/tripService';
import { Agency, Trip, TripCategory } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { slugify } from '@/utils/slugUtils';
import { useToast } from '@/context/ToastContext';

interface TripCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
  onCreated: (trip: Trip) => void;
}

export const TripCreateModal: React.FC<TripCreateModalProps> = ({
  isOpen,
  onClose,
  agency,
  onCreated,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [price, setPrice] = useState('1290');
  const [durationDays, setDurationDays] = useState('3');
  const [category, setCategory] = useState<TripCategory>('NATUREZA');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80'
  );
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const slug = `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
      const now = new Date();
      const end = new Date(now.getTime() + Number(durationDays) * 86400000);

      const created = await createTripInFirestore({
        agencyId: agency.id,
        agencyName: agency.name,
        agencySlug: agency.slug,
        title: title.trim(),
        slug,
        description: description.trim(),
        destination: destination.trim(),
        price: Number(price),
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        durationDays: Math.max(1, Number(durationDays)),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        category,
        tags: [CATEGORY_LABELS[category]],
        travelerTypes: ['CASAL', 'AMIGOS'],
        itinerary: [],
        boardingPoints: [],
        paymentMethods: ['Pix', 'Cartão de Crédito'],
        included: ['Guia credenciado SouNativo'],
        notIncluded: ['Despesas pessoais'],
        maxGuests: 16,
        passengerConfig: { allowChildren: true, childAgeLimit: 12, childPriceMultiplier: 0.7 },
        rating: 0,
        totalReviews: 0,
        featured: false,
        isActive: true,
      });

      showToast('Pacote publicado com sucesso no Firestore!', 'success');
      onCreated(created);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao publicar pacote.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publicar Nova Experiência">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="trip-title" className="block text-xs font-semibold text-stone-700 mb-1">
            Título do pacote
          </label>
          <input
            id="trip-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Travessia Chapada Diamantina"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="trip-dest" className="block text-xs font-semibold text-stone-700 mb-1">
              Destino
            </label>
            <input
              id="trip-dest"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Lençóis, BA"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="trip-cat" className="block text-xs font-semibold text-stone-700 mb-1">
              Categoria
            </label>
            <select
              id="trip-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as TripCategory)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
            >
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>)
                .filter((k) => k !== 'ALL')
                .map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="trip-price" className="block text-xs font-semibold text-stone-700 mb-1">
              Valor (R$)
            </label>
            <input
              id="trip-price"
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="trip-days" className="block text-xs font-semibold text-stone-700 mb-1">
              Duração (dias)
            </label>
            <input
              id="trip-days"
              type="number"
              min="1"
              max="90"
              required
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="trip-img" className="block text-xs font-semibold text-stone-700 mb-1">
            URL da imagem de capa
          </label>
          <input
            id="trip-img"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="trip-desc" className="block text-xs font-semibold text-stone-700 mb-1">
            Descrição da experiência
          </label>
          <textarea
            id="trip-desc"
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os destaques e diferenciais do roteiro..."
            className="w-full rounded-xl border border-stone-300 p-3 text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Publicar roteiro
          </Button>
        </div>
      </form>
    </Modal>
  );
};
