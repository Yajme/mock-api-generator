import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { AuthError } from "../utils/index.js";
import { env } from "#src/config/env";
import { JWTExpired } from "jose/errors";
interface AuthUser {
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);
export const authenticateJwt = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<AuthUser | AuthError | undefined | void> => {
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      throw new AuthError("Missing token");
    }

    const token = header.split(" ")[1];
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    });

    // Ensure payload is an object (JwtPayload), not a string
    if (typeof payload === "string") {
      throw new AuthError("Invalid token payload");
    }

    req.user = payload as AuthUser;
    next();
  } catch (error) {
    if (error instanceof JWTExpired) {
      return next(new AuthError("Token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthError("Invalid token"));
    }
    return next(error);
  }
};
