import dotenv from 'dotenv';
dotenv.config()

interface Env {
  [key: string]: any;
}
export const env:Env = {

  PORT : process.env.PORT,
  NODE_ENV : process.env.NODE_ENV || 'Development',

  // database
  SUPABASE_CONNECTION_STRING : process.env.SUPABASE_CONNECTION_STRING,
  SUPABASE_URL : process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  SUPABASE_JWT: process.env.SUPABASE_JWT,
  // JWT 
  JWT_SECRET : process.env.JWT_SECRET, 

  INTERNAL_SECRET : process.env.INTERNAL_SECRET,
  API_RATE_LIMIT_WINDOW_MS: process.env.API_RATE_LIMIT_WINDOW_MS,
  API_RATE_LIMIT_MAX_REQUESTS: process.env.API_RATE_LIMIT_MAX_REQUESTS,
}
