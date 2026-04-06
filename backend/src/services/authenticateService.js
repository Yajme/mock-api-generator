// src/utils/apiService
import {connection} from '../config/database.js';
import bcrypt from 'bcryptjs';
import {UserError,HttpStatus} from '../utils/index.js';
import crypto from 'crypto';

export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
}

export const hashApiKey = (rawKey) => {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

const verifyApiKey = async (rawKey,storedHash)=>{
return await bcrypt.compare(rawKey,storedHash);
}

export const registerApiKey = async ({key, user_id, permissions}) =>{
  try {
    if(!key) throw new Error('Invalid Key',HttpStatus.BAD_REQUEST);
    const hashedKey = await hashApiKey(key);
    const query = "INSERT INTO api_keys (user_id,key_hash,permissions) VALUES ($1,$2,$3)";
    
    await connection.query(query,[user_id,hashedKey,permissions]);

    return hashedKey;
  } catch (error) {
    throw error;
  }
}
export const authenticateKey = async (key) =>{
  try {
    if(!key) throw new Error('Invalid Parameter');
    const query = "SELECT key_hash,is_active,permissions,user_id FROM api_keys WHERE key_hash = $1"; 
    const hashedKey = await hashApiKey(key);
    const response = await connection.query(query,[hashedKey]);
    if(response.rowCount < 1) throw new UserError('Invalid API Key',HttpStatus.UNAUTHORIZED);
    return response.rows[0];  
  } catch (error) {
    throw error; 
  }
}
