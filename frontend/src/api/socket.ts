import { io, type Socket } from 'socket.io-client';

const WS_BASE = import.meta.env.VITE_WS_URL ?? window.location.origin;

export function connectAsChild(token: string): Socket {
  return io(`${WS_BASE}/chat`, {
    transports: ['websocket', 'polling'],
    auth: { role: 'child', token },
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });
}

export function connectAsOperator(jwt: string): Socket {
  return io(`${WS_BASE}/chat`, {
    transports: ['websocket', 'polling'],
    auth: { role: 'operator', jwt },
  });
}
