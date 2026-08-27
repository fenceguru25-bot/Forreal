import { NextFunction, Request, Response } from 'express';

const PROHIBITED_STATES = ['WA', 'ID', 'MI', 'NV'];

const normalizeState = (value: unknown) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

export const geoblock = (req: Request, res: Response, next: NextFunction) => {
  const state =
    normalizeState(req.body?.state) ||
    normalizeState(req.query?.state) ||
    normalizeState(req.user?.state);

  if (state && PROHIBITED_STATES.includes(state)) {
    return res.status(403).json({
      error: `ForReal Casino is not available in ${state}.`,
    });
  }

  return next();
};

export { PROHIBITED_STATES };
