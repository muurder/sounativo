import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import {
  markAllNotificationsReadInFirestore,
  markNotificationReadInFirestore,
  subscribeToUserNotifications,
} from '@/services/notificationService';
import { AppNotification } from '@/types';
import { cn } from '@/utils/cn';

interface NotificationBellProps {
  userUid: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userUid }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToUserNotifications(userUid, setItems);
    return () => unsubscribe();
  }, [userUid]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const unreadCount = items.filter((item) => !item.read).length;

  const handleSelectItem = async (item: AppNotification) => {
    setOpen(false);
    if (!item.read) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      await markNotificationReadInFirestore(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsReadInFirestore(items);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : 'Abrir notificações'
        }
        aria-expanded={open}
        className="relative min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 hover:text-primary-700 transition-colors"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-600 text-white text-[10px] font-extrabold inline-flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Central de notificações"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-stone-200 bg-white shadow-editorial z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Notificações ({unreadCount} nova{unreadCount === 1 ? '' : 's'})
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:underline"
              >
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500">
              Nenhum alerta recente em sua conta.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-stone-100">
              {items.slice(0, 15).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void handleSelectItem(item)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors flex items-start gap-2.5',
                      !item.read && 'bg-primary-50/40'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 rounded-full shrink-0',
                        !item.read ? 'bg-primary-600' : 'bg-stone-300'
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-semibold text-stone-900 line-clamp-1">
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="text-[11px] text-stone-600 line-clamp-2">{item.body}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
