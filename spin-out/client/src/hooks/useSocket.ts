import { useEffect, useMemo, useRef } from 'react';
// @ts-expect-error The vendored dependency tree does not include socket.io-client declaration files.
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

type Socket = {
  connect(): Socket;
  disconnect(): Socket;
  emit(event: string, ...args: any[]): Socket;
  on(event: string, listener: (...args: any[]) => void): Socket;
  off(event: string, listener?: (...args: any[]) => void): Socket;
};

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const socketRef = useRef<Socket | null>(null);
  const endpoint = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

  const socket = useMemo<Socket>(() => io(endpoint, {
    path: '/socket.io',
    autoConnect: false,
    reconnection: true,
    auth: token ? { token } : undefined
  }) as Socket, [endpoint, token]);

  useEffect(() => {
    socketRef.current = socket;
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const on = (event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  };

  return { socket: socketRef.current ?? socket, on };
};
