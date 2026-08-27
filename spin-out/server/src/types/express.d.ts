import type { JwtPayload } from '../../../shared/src/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      rawBody?: string;
    }
  }
}

export {};
