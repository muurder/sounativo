import React, { useState } from 'react';
import { MessageSquarePlus, ShieldCheck, Star } from 'lucide-react';
import { TripReview, UserProfile } from '@/types';
import { createReviewInFirestore } from '@/services/reviewService';
import { useToast } from '@/context/ToastContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface TripReviewsSectionProps {
  tripId: string;
  agencyId: string;
  reviews: TripReview[];
  user: UserProfile | null;
  onRequireAuth: () => void;
  onReviewAdded: (review: TripReview) => void;
}

export const TripReviewsSection: React.FC<TripReviewsSectionProps> = ({
  tripId,
  agencyId,
  reviews,
  user,
  onRequireAuth,
  onReviewAdded,
}) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Faça login para avaliar este roteiro.', 'info');
      onRequireAuth();
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReviewInFirestore({
        tripId,
        agencyId,
        userUid: user.uid,
        userName: user.name,
        userPhotoURL: user.photoURL,
        rating,
        comment,
      });
      onReviewAdded(created);
      setComment('');
      setRating(5);
      showToast('Avaliação verificada publicada!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível enviar avaliação.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Avaliações de Viajantes ({reviews.length})
        </h2>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
          <ShieldCheck size={14} /> Selo Viagem Verificada ativo
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-stone-500">
          Ainda não há avaliações registradas para este roteiro. Viajantes com reserva confirmada
          podem publicar a primeira avaliação verificada.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-stone-900">{review.userName}</span>
                  {(review.verifiedBooking || review.bookingId) && (
                    <Badge tone="success">
                      <ShieldCheck size={11} /> Viagem Verificada
                    </Badge>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {review.rating}.0
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-600">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-stone-100 pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-stone-800 inline-flex items-center gap-1.5">
              <MessageSquarePlus size={16} className="text-primary-600" />
              Compartilhe sua experiência
            </p>
            <p className="text-xs text-stone-500">
              Disponível para viajantes com reserva confirmada neste pacote.
            </p>
          </div>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} estrela${value > 1 ? 's' : ''}`}
                onClick={() => setRating(value)}
                className="p-1 rounded-md hover:bg-stone-100"
              >
                <Star
                  size={18}
                  className={cn(
                    value <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={3}
          required
          minLength={5}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Como foi o suporte da agência, o guia e a logística do passeio?"
          className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
        />

        <Button type="submit" size="sm" variant="outline" loading={submitting}>
          Publicar avaliação verificada
        </Button>
      </form>
    </section>
  );
};
