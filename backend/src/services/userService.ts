import { connection } from '../config/database';
import bcrypt from 'bcryptjs';
import { HttpStatus, UserError, AuthError, NotFoundError, ForbiddenError, signToken } from '../utils/index';

interface IUser {
  id?: string;
  username?: string;
  email?: string;
  password?: string;
  password_hash?: string;
  deleted_at?: Date;
}

const SALT_ROUNDS = 12;

const verifyPassword = async (rawPass: string, storedHash: string): Promise<boolean> => {
  return await bcrypt.compare(rawPass, storedHash);
};

const hashPassword = async (rawPass: string): Promise<string> => {
  return await bcrypt.hash(rawPass, SALT_ROUNDS);
};

const isUserExisting = async (username: string, email: string): Promise<boolean> => {
  try {
    const query = "SELECT username,email FROM users WHERE username = $1 OR email = $2";
    const response = await connection.query(query, [username, email]);
    return (response.rowCount ?? 0) > 0;
  } catch (error) {
    throw error; // Re-throw the error for proper handling upstream
  }
};

export const registerUser = async (user: IUser = {}): Promise<void> => {
  try {
    const { username, email, password } = user;
    if (!username || !email || !password) throw new UserError('All fields are required', HttpStatus.BAD_REQUEST);
    
    const userExists = await isUserExisting(username, email);
    if (userExists) throw new ForbiddenError("This username or email already exist");

    const hashedPassword = await hashPassword(password);

    const query = "INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING id;";
    const result = await connection.query(query, [username, email, hashedPassword]);

    if ((result.rowCount ?? 0) < 1) throw new Error('There is an error with registering user');
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  try {
    if (!email || !password) throw new UserError("Fields must be filled", HttpStatus.BAD_REQUEST);

    const query = "SELECT password_hash,id,username FROM users WHERE deleted_at IS NULL AND email = $1";
    const response = await connection.query(query, [email]);

    if ((response.rowCount ?? 0) < 1) throw new NotFoundError("User not found");
    const user = response.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new AuthError("Invalid Password");

    const token = signToken({ id: user.id, username: user.username });
    return token;
  } catch (error) {
    throw error;
  }
};
