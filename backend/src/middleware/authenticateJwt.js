import {verifyToken,AuthError} from '../utils/index.js';
export const authenticateJwt = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) throw new AuthError('Missing token')

  const token = header.split(' ')[1]
  const payload = verifyToken(token)   // throws if expired or invalid
  req.user = payload
  next()
}
