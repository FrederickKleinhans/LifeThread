import { create } from 'zustand';

export type NotificationTone = 'info' | 'success' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  tone: NotificationTone;
  duration?: number;
}

interface NotificationStore {
  items: AppNotification[];
  push: (notification: Omit<AppNotification, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
  info: (title: string, message?: string, duration?: number) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
}

function makeId() {
  return crypto.randomUUID();
}

export const useNotifications = create<NotificationStore>((set, get) => ({
  items: [],
  push: (notification) => {
    const id = notification.id ?? makeId();
    const item: AppNotification = {
      id,
      title: notification.title,
      message: notification.message,
      tone: notification.tone ?? 'info',
      duration: notification.duration ?? 3500,
    };

    set((state) => ({ items: [...state.items, item] }));

    if (item.duration && item.duration > 0) {
      window.setTimeout(() => {
        get().dismiss(id);
      }, item.duration);
    }

    return id;
  },
  dismiss: (id) => {
    set((state) => ({ items: state.items.filter((notification) => notification.id !== id) }));
  },
  info: (title, message, duration) => get().push({ title, message, tone: 'info', duration }),
  success: (title, message, duration) => get().push({ title, message, tone: 'success', duration }),
  error: (title, message, duration) => get().push({ title, message, tone: 'error', duration }),
}));
