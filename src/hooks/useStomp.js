import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE } from '../config';
import { Auth } from '../api/client';

// One STOMP-over-SockJS connection for the lifetime of the workspace screen.
// Auto-reconnects every 3 s (same as the original). `onConnect` is called on
// every (re)connect so the caller can re-subscribe to the open page.
export function useStomp(onConnect) {
  const clientRef = useRef(null);
  const cb = useRef(onConnect);
  cb.current = onConnect;

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}?token=${encodeURIComponent(Auth.getToken())}`),
      reconnectDelay: 3000,
      debug: () => {},
      onConnect: () => cb.current && cb.current(),
      onStompError: (f) => console.error('STOMP error', f),
      onWebSocketError: (e) => console.error('STOMP connection error, retrying in 3s', e),
    });
    clientRef.current = client;
    client.activate();
    return () => { client.deactivate(); clientRef.current = null; };
  }, []);

  return clientRef;
}
