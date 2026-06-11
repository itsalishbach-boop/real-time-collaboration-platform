'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Bell, X, CheckCheck, MessageSquare, FileText, Users, AtSign } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  message: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  note_update: { icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
  workspace_join: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  mention: { icon: AtSign, color: 'text-orange-600', bg: 'bg-orange-50' },
};

function NotifIcon({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100' };
  const Icon = cfg.icon;
  return (
    <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-4 h-4 ${cfg.color}`} />
    </div>
  );
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/notifications/')
      .then((res) => setNotifications(res.data.results || res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const markAll = async () => {
    await api.post('/notifications/mark-read/');
    setNotifications((n) => n.map((x) => ({ ...x, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700" />
          <span className="font-bold text-sm text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-center px-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-1">
              <Bell className="w-5 h-5 text-gray-300" />
            </div>
            <p className="font-semibold text-sm text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400">No notifications yet. We&apos;ll let you know when something happens.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50 ${
                !n.is_read ? 'bg-green-50/50' : ''
              }`}
            >
              <NotifIcon type={n.notification_type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{n.title}</p>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
