import winston from "winston";
import { logger, errorLogger } from "express-winston";

export const consoleLogger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize({ all: true }),
    winston.format.simple(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`,
    ),
  ),
});

// Middleware

export const loggerMiddleware = logger(consoleLogger);

export const errorLoggerMiddleware = errorLogger(consoleLogger);
