import { useEffect, useMemo, useRef } from 'react';
import { io, type Socket } from 'socket.io-client/dist/socket.io.js';
import { useAuthStore } from '../store/authStore';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const socketRef = useRef<Socket | null>(null);
  const endpoint = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

  const socket = useMemo(() => io(endpoint, {
    path: '/socket.io',
    autoConnect: false,
    reconnection: true,
    auth: token ? { token } : undefined
  }), [endpoint, token]);

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
