import { NextFunction, Request, Response } from 'express';
import db from '../config/database.js';

let logsTableReady: Promise<void> | null = null;

const ensureLogsTable = async (): Promise<void> => {
  if (!logsTableReady) {
    logsTableReady = db.connection
      .query(`
        CREATE TABLE IF NOT EXISTS logs (
          id BIGSERIAL PRIMARY KEY,
          method TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          request_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      .then(() => undefined)
      .catch((error) => {
        logsTableReady = null;
        throw error;
      });
  }

  await logsTableReady;
};

export const logRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureLogsTable();
    await db.connection.query(
      `
        INSERT INTO logs (method, endpoint, ip_address, user_agent, request_id)
        VALUES ($1, $2, $3, $4, $5);
      `,
      [
        req.method,
        req.originalUrl,
        req.ip || req.socket.remoteAddress || null,
        req.get('user-agent') ?? null,
        req.get('x-request-id') ?? null,
      ],
    );

    next();
  } catch (error) {
    next(error);
  }
};
