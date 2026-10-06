import { Request, Response, NextFunction } from 'express';

/**
 * Strips MongoDB operator injection keys ($gt, $ne, $where, etc.) and trims strings.
 */
export function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item));
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      cleaned[key] = sanitizePayload(value);
    }
    return cleaned;
  }
  return obj;
}

export function securitySanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizePayload(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    const cleanQuery = sanitizePayload(req.query);
    for (const key of Object.keys(req.query)) {
      delete (req.query as any)[key];
    }
    Object.assign(req.query, cleanQuery);
  }
  next();
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email || '').toLowerCase());
}

export function isValidPassword(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 6) {
    return { valid: false, reason: 'Password must be at least 6 characters long.' };
  }
  return { valid: true };
}
