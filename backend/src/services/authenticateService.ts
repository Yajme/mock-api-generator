// src/utils/apiService
import { connection } from '../config/database';
import bcrypt from 'bcryptjs';
import { UserError, HttpStatus } from '../utils/index';
import crypto from 'crypto';

interface IApiKey {
  key: string;
  user_id: string;
  permissions: string; // or a more specific type if known, e.g., 'read' | 'write'
}

export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashApiKey = (rawKey: string): string => {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
};

const verifyApiKey = async (rawKey: string, storedHash: string): Promise<boolean> => {
  return await bcrypt.compare(rawKey, storedHash);
};

export const registerApiKey = async ({ key, user_id, permissions }: IApiKey): Promise<string> => {
  try {
    if (!key) throw new UserError('Invalid Key', HttpStatus.BAD_REQUEST);
    const hashedKey = await hashApiKey(key);
    const query = "INSERT INTO api_keys (user_id,key_hash,permissions) VALUES ($1,$2,$3)";

    await connection.query(query, [user_id, hashedKey, permissions]);

    return hashedKey;
  } catch (error) {
    throw error;
  }
};

export const authenticateKey = async (key: string): Promise<any> => {
  try {
    if (!key) throw new UserError('Invalid Parameter', HttpStatus.BAD_REQUEST);
    const query = "SELECT key_hash,is_active,permissions,user_id FROM api_keys WHERE key_hash = $1";
    const hashedKey = await hashApiKey(key);
    const response = await connection.query(query, [hashedKey]);
    if ((response.rowCount ?? 0) < 1) throw new UserError('Invalid API Key', HttpStatus.UNAUTHORIZED);
    return response.rows[0];
  } catch (error) {
    throw error;
  }
};
