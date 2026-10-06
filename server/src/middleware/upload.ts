import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AppError } from './error.ts';

const UPLOAD_DIR = path.resolve(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.txt', '.docx', '.md']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);
const BANNED_EXTENSIONS = new Set([
  '.exe', '.sh', '.bat', '.cmd', '.js', '.ts', '.php', '.py', '.dll', '.bin', '.msi', '.jar', '.html', '.svg',
]);

export function sanitizeOriginalFilename(name: string): string {
  const base = path.basename(String(name || 'document.txt').replace(/\0/g, ''));
  return base.replace(/[^a-zA-Z0-9._\-\s()]/g, '_').slice(0, 140) || 'document.txt';
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    file.originalname = sanitizeOriginalFilename(file.originalname);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeRandomName);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const cleanName = sanitizeOriginalFilename(file.originalname);
    const ext = path.extname(cleanName).toLowerCase();
    if (BANNED_EXTENSIONS.has(ext)) {
      return cb(new AppError('Executable or script files are strictly prohibited.', 400));
    }
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new AppError('Unsupported file format. Only PDF, TXT, DOCX, and MD files are allowed.', 400));
    }
    if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError('Unsupported MIME type for study document upload.', 400));
    }
    cb(null, true);
  },
});
