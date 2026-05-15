import { NextFunction, Request, Response } from "express";
import { env } from "#src/config/env.js";
import { HttpStatus, UserError } from "#src/utils/index.js";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getClientId = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket.remoteAddress || "unknown";
};

const createRateLimiter = ({ windowMs, maxRequests }: RateLimitOptions) => {
  const buckets = new Map<string, RateLimitBucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const clientId = getClientId(req);
    const currentBucket = buckets.get(clientId);

    if (!currentBucket || now >= currentBucket.resetAt) {
      buckets.set(clientId, {
        count: 1,
        resetAt: now + windowMs,
      });
    } else {
      currentBucket.count += 1;
    }

    const bucket = buckets.get(clientId)!;
    const remaining = Math.max(maxRequests - bucket.count, 0);

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader(
      "X-RateLimit-Reset",
      String(Math.ceil(bucket.resetAt / 1000)),
    );

    if (bucket.count > maxRequests) {
      const retryAfterSeconds = Math.max(
        Math.ceil((bucket.resetAt - now) / 1000),
        1,
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      next(
        new UserError(
          "Too many requests. Please try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
      return;
    }

    if (buckets.size > 2000) {
      for (const [key, value] of buckets.entries()) {
        if (value.resetAt <= now) {
          buckets.delete(key);
        }
      }
    }

    next();
  };
};

const API_RATE_LIMIT_WINDOW_MS = parsePositiveInteger(
  env.API_RATE_LIMIT_WINDOW_MS,
  60_000,
);
const API_RATE_LIMIT_MAX_REQUESTS = parsePositiveInteger(
  env.API_RATE_LIMIT_MAX_REQUESTS,
  100,
);

export const apiRateLimiter = createRateLimiter({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  maxRequests: API_RATE_LIMIT_MAX_REQUESTS,
});
