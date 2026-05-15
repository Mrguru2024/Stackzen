import { Request, Response } from 'express';

export const _healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
};

export const _ping = (req: Request, res: Response) => {
  res.send('pong');
};
