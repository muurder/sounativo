import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  COLLECTIONS,
  db,
  isMissingIndexError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { AppNotification, NotificationType } from '@/types';

const VALID_NOTIFICATION_TYPES = new Set<NotificationType>([
  'BOOKING_CREATED',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'NEW_REVIEW',
  'PLAN_APPROVED',
  'SYSTEM',
]);

export function normalizeNotificationDoc(
  id: string,
  raw: Record<string, unknown>
): AppNotification {
  const typeCandidate = raw.type as NotificationType | undefined;
  const createdAt = toIsoTimestamp(raw.createdAt, new Date(0).toISOString());
  const updatedAt = toIsoTimestamp(raw.updatedAt);

  return {
    id,
    recipientUid: typeof raw.recipientUid === 'string' ? raw.recipientUid : '',
    ...(typeof raw.actorUid === 'string' && raw.actorUid ? { actorUid: raw.actorUid } : {}),
    type: typeCandidate && VALID_NOTIFICATION_TYPES.has(typeCandidate) ? typeCandidate : 'SYSTEM',
    title:
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : 'Atualização SouNativo',
    ...(typeof raw.body === 'string' && raw.body.trim() ? { body: raw.body.trim() } : {}),
    ...(typeof raw.link === 'string' && raw.link.trim() ? { link: raw.link.trim() } : {}),
    read: Boolean(raw.read),
    createdAt,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function sortNotificationsByRecent(items: AppNotification[]): AppNotification[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export interface CreateNotificationInput {
  recipientUid: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export async function createNotificationInFirestore(
  input: CreateNotificationInput
): Promise<AppNotification | null> {
  if (!db) return null;
  const actorUid = auth?.currentUser?.uid;
  const cleanRecipient = input.recipientUid.trim().slice(0, 128);
  const cleanTitle = input.title.trim().slice(0, 160);

  if (!actorUid || !cleanRecipient || !cleanTitle) {
    return null;
  }

  const sanitized = {
    recipientUid: cleanRecipient,
    actorUid,
    type: VALID_NOTIFICATION_TYPES.has(input.type) ? input.type : ('SYSTEM' as const),
    title: cleanTitle,
    ...(input.body?.trim() ? { body: input.body.trim().slice(0, 600) } : {}),
    ...(input.link?.trim() ? { link: input.link.trim().slice(0, 200) } : {}),
    read: false,
  };

  try {
    const ref = await addDoc(collection(db, COLLECTIONS.notifications), {
      ...stripUndefined(sanitized as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      ...sanitized,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[notificationService] Falha não-bloqueante ao gravar notificação:', err);
    return null;
  }
}

export async function fetchUserNotifications(recipientUid: string): Promise<AppNotification[]> {
  if (!db || !recipientUid) return [];
  try {
    const q = query(
      collection(db, COLLECTIONS.notifications),
      where('recipientUid', '==', recipientUid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      normalizeNotificationDoc(d.id, d.data() as Record<string, unknown>)
    );
  } catch (err: unknown) {
    if (isMissingIndexError(err)) {
      try {
        const fallbackSnap = await getDocs(
          query(
            collection(db, COLLECTIONS.notifications),
            where('recipientUid', '==', recipientUid),
            limit(30)
          )
        );
        return sortNotificationsByRecent(
          fallbackSnap.docs.map((d) =>
            normalizeNotificationDoc(d.id, d.data() as Record<string, unknown>)
          )
        );
      } catch {
        return [];
      }
    }
    return [];
  }
}

export function subscribeToUserNotifications(
  recipientUid: string,
  onChange: (items: AppNotification[]) => void
): Unsubscribe {
  if (!db || !recipientUid) {
    onChange([]);
    return () => undefined;
  }

  const firestoreDb = db;
  let activeUnsub: Unsubscribe = () => undefined;
  let usingFallback = false;

  const attachListener = (withOrderBy: boolean) => {
    const q = withOrderBy
      ? query(
          collection(firestoreDb, COLLECTIONS.notifications),
          where('recipientUid', '==', recipientUid),
          orderBy('createdAt', 'desc'),
          limit(30)
        )
      : query(
          collection(firestoreDb, COLLECTIONS.notifications),
          where('recipientUid', '==', recipientUid),
          limit(30)
        );

    activeUnsub = onSnapshot(
      q,
      (snap) => {
        const items = sortNotificationsByRecent(
          snap.docs.map((d) => normalizeNotificationDoc(d.id, d.data() as Record<string, unknown>))
        );
        onChange(items);
      },
      (err) => {
        if (withOrderBy && !usingFallback && isMissingIndexError(err)) {
          usingFallback = true;
          activeUnsub();
          attachListener(false);
          return;
        }
        console.warn('[notificationService] Listener de notificações indisponível:', err);
      }
    );
  };

  attachListener(true);
  return () => activeUnsub();
}

export async function markNotificationReadInFirestore(notificationId: string): Promise<void> {
  if (!db || !notificationId) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.notifications, notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[notificationService] Falha ao marcar notificação como lida:', err);
  }
}

export async function markAllNotificationsReadInFirestore(items: AppNotification[]): Promise<void> {
  const unread = items.filter((item) => !item.read && item.id);
  if (!db || unread.length === 0) return;
  await Promise.allSettled(unread.map((item) => markNotificationReadInFirestore(item.id)));
}

export interface TransactionalAlertPayload {
  event: string;
  recipientEmail?: string;
  recipientName?: string;
  subject: string;
  summary: string;
  voucherCode?: string;
  link?: string;
}

export async function dispatchTransactionalAlert(
  payload: TransactionalAlertPayload
): Promise<void> {
  if (typeof fetch !== 'function') return;
  try {
    const idToken = await auth?.currentUser?.getIdToken().catch(() => '');
    if (!idToken) return;
    await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking relay: in-app Firestore notification remains primary source of truth
  }
}
