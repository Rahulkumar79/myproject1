import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_DEV_JWT_SECRET = 'lumina_scholar_production_grade_jwt_secret_key_2026';

const rawJwtSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
const isPlaceholderSecret =
  !rawJwtSecret ||
  rawJwtSecret.length < 16 ||
  rawJwtSecret === 'replace_with_a_strong_64_char_random_jwt_secret_in_production';

if (process.env.NODE_ENV === 'production' && isPlaceholderSecret) {
  console.warn(
    '[Security Notice]: JWT_SECRET is not set or uses a placeholder. Using fallback signing key; set a strong 64-character JWT_SECRET in production.'
  );
}

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: !isPlaceholderSecret ? rawJwtSecret : DEFAULT_DEV_JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:3000',
  SERVER_URL: process.env.SERVER_URL || process.env.APP_URL || 'http://localhost:3000',
};

export function parseJwtExpiresInSeconds(val: string): number {
  const trimmed = String(val || '7d').trim();
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 604800; // 7 days default
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  if (unit === 'h') return amount * 3600;
  if (unit === 'd') return amount * 86400;
  return 604800;
}

export function isRealMongoUri(uri: string): boolean {
  if (!uri || uri.trim() === '') return false;
  if (uri.includes('<username>') || uri.includes('<password>') || uri === 'MY_MONGODB_URI') {
    return false;
  }
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
}

export function hasValidGeminiKey(): boolean {
  const key = env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY');
}

