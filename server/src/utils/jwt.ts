import jwt from 'jsonwebtoken';
import { env, parseJwtExpiresInSeconds } from '../config/env.ts';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'student' | 'admin';
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export function signToken(payload: JwtPayload, expiresInSeconds?: number): string {
  const ttl = expiresInSeconds !== undefined ? expiresInSeconds : parseJwtExpiresInSeconds(env.JWT_EXPIRES_IN);
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion ?? 0,
    },
    env.JWT_SECRET,
    {
      expiresIn: ttl,
    }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
