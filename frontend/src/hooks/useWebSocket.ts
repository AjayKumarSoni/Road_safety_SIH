import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { handleWsMessage, setWsConnected } = useStore();

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('WS connected');
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          handleWsMessage(msg);
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Reconnect after 3s
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);
}
