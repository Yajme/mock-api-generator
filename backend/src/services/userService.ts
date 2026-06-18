import { connection } from "../config/database";
import bcrypt from "bcryptjs";
import {
  HttpStatus,
  UserError,
  AuthError,
  NotFoundError,
  ForbiddenError,
  signToken,
} from "../utils/index";
import { supabase } from "#src/config/supabase";
import { SignupDto } from "../schema";

// This can be deprecated soon

interface IUser {
  id?: string;
  username?: string;
  email?: string;
  password?: string;
  password_hash?: string;
  deleted_at?: Date;
}

const SALT_ROUNDS = 12;

const verifyPassword = async (
  rawPass: string,
  storedHash: string,
): Promise<boolean> => {
  return await bcrypt.compare(rawPass, storedHash);
};

const hashPassword = async (rawPass: string): Promise<string> => {
  return await bcrypt.hash(rawPass, SALT_ROUNDS);
};

const isUserExisting = async (
  username: string,
  email: string,
): Promise<boolean> => {
  try {
    const query =
      "SELECT username,email FROM users WHERE username = $1 OR email = $2";
    const response = await connection.query(query, [username, email]);
    return (response.rowCount ?? 0) > 0;
  } catch (error) {
    throw error; // Re-throw the error for proper handling upstream
  }
};

export const registerUser = async (user: IUser = {}): Promise<void> => {
  try {
    const { username, email, password } = user;
    if (!username || !email || !password)
      throw new UserError("All fields are required", HttpStatus.BAD_REQUEST);

    const userExists = await isUserExisting(username, email);
    if (userExists)
      throw new ForbiddenError("This username or email already exist");

    const hashedPassword = await hashPassword(password);

    const query =
      "INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING id;";
    const result = await connection.query(query, [
      username,
      email,
      hashedPassword,
    ]);

    if ((result.rowCount ?? 0) < 1)
      throw new Error("There is an error with registering user");
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<Record<string,any>> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    const user = data.user;
    if (error) {
      throw error;
    }
    const token = data.session;
    return token;
  } catch (error) {
    throw error;
  }
};

export const signupUser = async ({
  email,
  password,
  first_name,
  last_name,
}: SignupDto) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
};
