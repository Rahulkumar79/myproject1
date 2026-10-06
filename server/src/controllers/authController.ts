import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { db } from '../config/db.ts';
import { signToken } from '../utils/jwt.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError, asyncHandler } from '../middleware/error.ts';
import { isValidEmail, isValidPassword } from '../validators/schemas.ts';

function sanitizeUser(user: any) {
  if (!user) return null;
  const { password, tokenVersion, ...rest } = user;
  return rest;
}

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, educationLevel, college, subjects, learningGoals, preferredStudyHours } = req.body;

  if (!name || String(name).trim().length < 2) {
    throw new AppError('Please provide your full name (at least 2 characters).', 400);
  }
  if (!isValidEmail(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }
  const pwdCheck = isValidPassword(password);
  if (!pwdCheck.valid) {
    throw new AppError(pwdCheck.reason || 'Invalid password.', 400);
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await db.users.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.users.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'student',
    isActive: true,
    profileImage: '',
    educationLevel: educationLevel || 'Undergraduate',
    college: college || '',
    subjects: Array.isArray(subjects) && subjects.length > 0 ? subjects : ['DBMS', 'Data Structures & Algorithms', 'Java'],
    learningGoals: Array.isArray(learningGoals) ? learningGoals : ['Master core CS fundamentals'],
    preferredStudyHours: Number(preferredStudyHours) || 3,
    streakDays: 1,
    lastStudyDate: new Date().toISOString().split('T')[0],
    tokenVersion: 0,
  });

  const token = signToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
    tokenVersion: 0,
  });

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Please provide both email and password.', 400);
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await db.users.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.isActive === false) {
    throw new AppError('Your account has been disabled. Please contact the platform administrator.', 403);
  }

  const isMatch = await bcrypt.compare(String(password), user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken({
    userId: String(user._id),
    email: user.email,
    role: user.role || 'student',
    tokenVersion: Number(user.tokenVersion || 0),
  });

  res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

export const logout = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await db.users.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, profileImage, educationLevel, college, subjects, learningGoals, preferredStudyHours } = req.body;
  const updates: Record<string, any> = {};

  if (name !== undefined) {
    if (String(name).trim().length < 2) {
      throw new AppError('Name must be at least 2 characters.', 400);
    }
    updates.name = String(name).trim();
  }
  if (profileImage !== undefined) updates.profileImage = String(profileImage);
  if (educationLevel !== undefined) updates.educationLevel = String(educationLevel);
  if (college !== undefined) updates.college = String(college);
  if (Array.isArray(subjects)) updates.subjects = subjects;
  if (Array.isArray(learningGoals)) updates.learningGoals = learningGoals;
  if (preferredStudyHours !== undefined) {
    updates.preferredStudyHours = Math.min(Math.max(Number(preferredStudyHours) || 2, 1), 14);
  }

  const updated = await db.users.updateById(req.user!._id, updates);
  res.json({
    success: true,
    user: sanitizeUser(updated),
  });
});

export const updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide both current password and new password.', 400);
  }

  const pwdCheck = isValidPassword(newPassword);
  if (!pwdCheck.valid) {
    throw new AppError(pwdCheck.reason || 'New password is invalid.', 400);
  }

  const user = await db.users.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isMatch = await bcrypt.compare(String(currentPassword), user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401);
  }

  const hashedPassword = await bcrypt.hash(String(newPassword), 10);
  const nextTokenVersion = Number(user.tokenVersion || 0) + 1;
  const passwordChangedAt = new Date().toISOString();
  await db.users.updateById(req.user!._id, {
    password: hashedPassword,
    passwordChangedAt,
    tokenVersion: nextTokenVersion,
  });

  const freshToken = signToken({
    userId: String(user._id),
    email: user.email,
    role: user.role || 'student',
    tokenVersion: nextTokenVersion,
  });

  res.json({
    success: true,
    token: freshToken,
    message: 'Password updated successfully.',
  });
});
