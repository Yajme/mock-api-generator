import dotenv from 'dotenv';
dotenv.config()


export const env = {

  PORT : process.env.PORT,
  NODE_ENV : process.env.NODE_ENV || 'Development',

  // database
  SUPABASE_URL : process.env.SUPABASE_URL,
  
  // JWT 
  JWT_SECRET : process.env.JWT_SECRET, 

  INTERNAL_SECRET : process.env.INTERNAL_SECRET
}
