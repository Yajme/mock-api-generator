// middleware/internalOnly.js
import { env } from '../config/env.js'
import { ForbiddenError } from '../utils/AppError.js'

export const internalOnly = (req, res, next) => {
  const secret = req.headers['x-internal-secret']

  if (!secret || secret !== env.INTERNAL_SECRET) {
    throw new ForbiddenError('Access restricted')
  }

  next()
}
