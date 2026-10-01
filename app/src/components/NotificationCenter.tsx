import { useEffect } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useNotifications } from '../stores/notifications';
import { markNotificationOpened } from '../lib/reengagementNotifications';

const toneStyles = {
  info: 'border-[#d8cdbf] bg-[#fbf9f6] text-[#4b443c]',
  success: 'border-[#9ad0b6] bg-[#ebfff4] text-[#1d5b41]',
  error: 'border-[#f3b5b1] bg-[#fff1f0] text-[#8a2d2d]',
} as const;

const toneIcons = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
} as const;

export function NotificationCenter() {
  const notifications = useNotifications((state) => state.items);
  const dismiss = useNotifications((state) => state.dismiss);

  useEffect(() => {
    for (const notification of notifications) markNotificationOpened(notification.id);
  }, [notifications]);

  if (!notifications.length) return null;

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-2">
        {notifications.map((notification) => {
          const Icon = toneIcons[notification.tone];

          return (
            <div
              key={notification.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border-2 p-3 shadow-[0_12px_30px_rgba(30,22,56,0.12)] ${toneStyles[notification.tone]}`}
            >
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{notification.title}</p>
                {notification.message && <p className="mt-1 text-xs opacity-80">{notification.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(notification.id)}
                className="mt-0.5 rounded-full p-1 text-current/70 hover:bg-black/5"
                aria-label={`Dismiss ${notification.title} notification`}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
