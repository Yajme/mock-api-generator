import { HttpStatusType } from './httpStatus.js';

export class UserError extends Error {
  public status: HttpStatusType;

  constructor(message: string, status: HttpStatusType){
    super(message);
    this.name = 'UserError';
    this.status = status;
  }
}
