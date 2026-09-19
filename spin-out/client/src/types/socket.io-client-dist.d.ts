declare module 'socket.io-client/dist/socket.io.js' {
  export interface Socket {
    connect(): Socket;
    disconnect(): Socket;
    emit(event: string, ...args: any[]): Socket;
    on(event: string, listener: (...args: any[]) => void): Socket;
    off(event: string, listener?: (...args: any[]) => void): Socket;
  }

  export interface SocketOptions {
    path?: string;
    autoConnect?: boolean;
    reconnection?: boolean;
    auth?: Record<string, unknown>;
  }

  export function io(uri: string, options?: SocketOptions): Socket;
}
