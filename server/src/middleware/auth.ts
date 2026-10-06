import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.ts';
import { db } from '../config/db.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    isActive: boolean;
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await db.users.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists. Please log in again.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled by an administrator.',
      });
    }

    const currentTokenVersion = Number(user.tokenVersion || 0);
    const payloadTokenVersion = Number(decoded.tokenVersion || 0);
    if (currentTokenVersion > payloadTokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Password was recently changed. Please log in again.',
      });
    }

    if (user.passwordChangedAt && decoded.iat && decoded.tokenVersion === undefined) {
      const changedTimestampSec = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
      if (decoded.iat < changedTimestampSec) {
        return res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again.',
        });
      }
    }

    req.user = {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role || 'student',
      isActive: user.isActive !== false,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

export function authorizeAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Administrator privileges are required to access this resource.',
    });
  }
  next();
}
