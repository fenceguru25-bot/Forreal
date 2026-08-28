import 'socket.io';
import type { CorsOptions } from 'cors';

declare module 'socket.io' {
  interface ServerOptions {
    cors?: CorsOptions;
  }
}
