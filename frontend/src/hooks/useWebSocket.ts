import { useEffect, useRef, useCallback, useState } from 'react';
import { getWsUrl } from '@/lib/api';

type MessageHandler = (data: unknown) => void;

export function useWebSocket(path: string, onMessage: MessageHandler, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled || typeof window === 'undefined') return;

    const url = getWsUrl(path);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Only the CURRENT socket instance should update state
      if (mountedRef.current && wsRef.current === ws) setIsConnected(true);
    };

    ws.onmessage = (event) => {
      // Discard messages from any stale socket that hasn't fully closed yet
      if (!mountedRef.current || wsRef.current !== ws) return;
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      // Stale sockets (replaced by reconnect) must not schedule another reconnect
      if (!mountedRef.current || wsRef.current !== ws) return;
      setIsConnected(false);
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [path, onMessage, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      // Null handlers BEFORE closing so the async onclose callback is a no-op
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, isConnected };
}
