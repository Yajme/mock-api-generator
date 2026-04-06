import {connection} from '../config/database.js';
import bcrypt from 'bcryptjs';
import {HttpStatus,UserError, AuthError,NotFoundError,ForbiddenError,signToken} from '../utils/index.js';

const SALT_ROUNDS = 12;
const verifyPassword = async (rawPass,storedHash) => 
{
  return await bcrypt.compare(rawPass,storedHash);
}

const hashPassword = async (rawPass) =>{
  return await bcrypt.hash(rawPass,SALT_ROUNDS);
}

const isUserExisting = async (username,email) =>{
  try {
    
    const query = "SELECT username,email FROM users WHERE username = $1 AND email = $2";
    const response = await connection.query(query,[username,email]);

    return response.rowCount > 0;
  } catch (error) {
    next(error);  
  }
}
export const registerUser = async (user = {}) => {
  try {
    const {username,email,password} = user;
    if(!username || !email || !password) throw new UserError('All fields are required',HttpStatus.BAD_REQUEST);
    if(isUserExisting) throw  new ForbiddenError("This username or email already exist");

    const hashedPassword = await hashPassword(password);

    //Verify Email 
    //Eh later na 
    const query = "INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING id;"; 
    const result = await connection.query(query,[username,email,hashedPassword]);
    
    // Check if the transaction succeed
    if(result.rowCount < 1) throw new Error('There is an error with registering user');
    
    
  } catch (error) {
    throw error;
  }
}

export const loginUser = async (email,password) =>{
try {
  if(!email || !password) throw new UserError("Fields must be filled", HttpStatus.BAD_REQUEST);
  
  const query = "SELECT password_hash,id,username FROM users WHERE deleted_at is NULL AND email = $1";
  const response = await connection.query(query,[email]);

  if(response.rowCount < 1) throw new NotFoundError("User not found");
  const user = response.rows[0];
  const valid = await verifyPassword(password,user.password_hash);
  if(!valid) throw new AuthError("Invalid Password");

  const token = signToken({id : user.id, username : user.username});
  return token;

} catch (error) {
 throw error; 
}
}

