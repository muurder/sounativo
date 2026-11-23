import { addDoc, collection } from 'firebase/firestore';
import {
  auth,
  COLLECTIONS,
  db,
  mapFirestoreError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { dispatchTransactionalAlert } from './notificationService';
import { sanitizePlainText } from '@/utils/securitySanitizer';

export type ContactMessageSource = 'CONTACT_FORM' | 'GROUP_QUOTE';
export type ContactMessageStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';

export interface CreateContactMessageInput {
  name: string;
  email: string;
  message: string;
  source?: ContactMessageSource;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  message: string;
  source: ContactMessageSource;
  userUid?: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt?: string;
}

const VALID_CONTACT_STATUSES = new Set<ContactMessageStatus>([
  'NEW',
  'IN_PROGRESS',
  'RESOLVED',
  'ARCHIVED',
]);

export function normalizeContactMessageDoc(
  id: string,
  raw: Record<string, unknown>
): ContactMessageRecord {
  const statusCandidate = raw.status as ContactMessageStatus | undefined;
  const source: ContactMessageSource =
    raw.source === 'GROUP_QUOTE' ? 'GROUP_QUOTE' : 'CONTACT_FORM';
  const createdAt = toIsoTimestamp(raw.createdAt, new Date(0).toISOString());
  const updatedAt = toIsoTimestamp(raw.updatedAt);

  return {
    id,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Visitante',
    email: typeof raw.email === 'string' ? raw.email : '',
    message: typeof raw.message === 'string' ? raw.message : '',
    source,
    ...(typeof raw.userUid === 'string' && raw.userUid ? { userUid: raw.userUid } : {}),
    status:
      statusCandidate && VALID_CONTACT_STATUSES.has(statusCandidate) ? statusCandidate : 'NEW',
    createdAt,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function submitContactMessageInFirestore(
  input: CreateContactMessageInput
): Promise<ContactMessageRecord> {
  const cleanName = sanitizePlainText(input.name, 120);
  const cleanEmail = input.email.trim().toLowerCase().slice(0, 254);
  const cleanMessage = sanitizePlainText(input.message, 2000);
  const source: ContactMessageSource = input.source ?? 'CONTACT_FORM';

  if (cleanName.length < 2) {
    throw new Error('Informe seu nome completo (mínimo de 2 caracteres).');
  }
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    throw new Error('Informe um endereço de e-mail válido.');
  }
  if (cleanMessage.length < 5) {
    throw new Error('Escreva uma mensagem com pelo menos 5 caracteres.');
  }

  if (!db) {
    throw new Error(
      'Banco de dados não configurado (.env.local). Envie sua solicitação diretamente para suporte@sounativo.com.'
    );
  }

  const currentUid = auth?.currentUser?.uid;
  const payload = stripUndefined({
    name: cleanName,
    email: cleanEmail,
    message: cleanMessage,
    source,
    userUid: currentUid || undefined,
    status: 'NEW' as const,
  });

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.contactMessages), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    void dispatchTransactionalAlert({
      event: 'CONTACT_MESSAGE',
      recipientName: 'Equipe SouNativo',
      subject: `[${source === 'GROUP_QUOTE' ? 'Cotação de Grupo' : 'Contato'}] ${cleanName}`,
      summary: `${cleanName} (${cleanEmail}): ${cleanMessage}`,
      link: 'https://sounativo.vercel.app/dashboard?mode=admin',
    });

    return {
      id: docRef.id,
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      source,
      ...(currentUid ? { userUid: currentUid } : {}),
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Não foi possível registrar sua mensagem de atendimento.');
  }
}
