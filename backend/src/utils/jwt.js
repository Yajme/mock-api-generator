// utils/jwt.js
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const signToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' })
}

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET)
}
