'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from './AuthContext';
import { Notification } from '@/lib/types';

interface PresenceContextType {
  unreadCount: number;
  latestNotification: Notification | null;
  clearUnread: () => void;
}

const PresenceContext = createContext<PresenceContextType>({
  unreadCount: 0,
  latestNotification: null,
  clearUnread: () => {},
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  const handleMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; notification?: Notification };
    if (msg.type === 'notification' && msg.notification) {
      setUnreadCount((n) => n + 1);
      setLatestNotification(msg.notification!);
    }
  }, []);

  // This connection drives TWO things:
  // 1. Sets is_online=True in DB on connect / False on disconnect (PresenceConsumer)
  // 2. Receives real-time notification pushes for this user
  useWebSocket('ws/notifications/', handleMessage, !!user);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return (
    <PresenceContext.Provider value={{ unreadCount, latestNotification, clearUnread }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
