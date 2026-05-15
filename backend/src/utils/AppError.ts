import { HttpStatus } from "./httpStatus.js";
import { UserError } from "./UserError.js";

export class AuthError extends UserError {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends UserError {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends UserError {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

export class InvalidDataError extends UserError {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = "InvalidDataError"
  }
}
