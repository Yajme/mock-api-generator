import { HttpStatus } from './httpStatus.js'
import { UserError } from './UserError.js'

export class AuthError extends UserError {
  constructor(message) {
    super(message, HttpStatus.UNAUTHORIZED)
  }
}

export class ForbiddenError extends UserError {
  constructor(message) {
    super(message, HttpStatus.FORBIDDEN)
  }
}

export class NotFoundError extends UserError {
  constructor(message) {
    super(message, HttpStatus.NOT_FOUND)
  }
}
