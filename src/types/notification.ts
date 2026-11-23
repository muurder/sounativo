export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'NEW_REVIEW'
  | 'PLAN_APPROVED'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  recipientUid: string;
  actorUid?: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}
