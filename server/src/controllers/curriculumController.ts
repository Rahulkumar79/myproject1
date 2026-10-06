import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError, asyncHandler } from '../middleware/error.ts';

// SUBJECTS
export const getSubjects = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, difficulty, search } = req.query;
  let subjects = await db.subjects.find({}, { sort: { name: 1 } });
  const topics = await db.topics.find();

  if (category && category !== 'All') {
    subjects = subjects.filter((s) => s.category === category);
  }
  if (difficulty && difficulty !== 'All') {
    subjects = subjects.filter((s) => s.difficulty === difficulty);
  }
  if (search) {
    const q = String(search).toLowerCase();
    subjects = subjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }

  const enriched = subjects.map((subj) => {
    const subjTopics = topics.filter(
      (t) => t.subject === subj.name || String(t.subject) === String(subj._id)
    );
    return {
      ...subj,
      topicCount: subjTopics.length,
      totalEstimatedMinutes: subjTopics.reduce((acc, t) => acc + (Number(t.estimatedStudyTime) || 45), 0),
    };
  });

  res.json({ success: true, subjects: enriched });
});

export const getSubjectById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  let subject = await db.subjects.findById(id);
  if (!subject) {
    subject = await db.subjects.findOne({ name: id });
  }
  if (!subject) {
    throw new AppError('Subject not found.', 404);
  }

  const allTopics = await db.topics.find();
  const topics = allTopics.filter(
    (t) => t.subject === subject.name || String(t.subject) === String(subject._id)
  );

  res.json({
    success: true,
    subject,
    topics,
  });
});

export const createSubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, category, difficulty, icon } = req.body;
  if (!name || !description || !category) {
    throw new AppError('Subject name, description, and category are required.', 400);
  }
  const created = await db.subjects.create({
    name: String(name).trim(),
    description: String(description).trim(),
    category: String(category).trim(),
    difficulty: difficulty || 'Intermediate',
    icon: icon || 'BookOpen',
  });
  res.status(201).json({ success: true, subject: created });
});

export const updateSubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, category, difficulty, icon } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = String(description).trim();
  if (category !== undefined) updates.category = String(category).trim();
  if (difficulty !== undefined) updates.difficulty = String(difficulty);
  if (icon !== undefined) updates.icon = String(icon);

  const updated = await db.subjects.updateById(req.params.id, updates);
  if (!updated) throw new AppError('Subject not found.', 404);
  res.json({ success: true, subject: updated });
});

export const deleteSubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subject = await db.subjects.findById(req.params.id);
  if (!subject) throw new AppError('Subject not found.', 404);
  await db.subjects.deleteById(req.params.id);
  await db.topics.deleteMany({ subject: subject.name });
  res.json({ success: true, message: 'Subject and associated topics deleted.' });
});

// TOPICS
export const getTopics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, difficulty, search } = req.query;
  let topics = await db.topics.find();
  if (subject && subject !== 'All') {
    topics = topics.filter((t) => t.subject === subject || String(t.subject) === String(subject));
  }
  if (difficulty && difficulty !== 'All') {
    topics = topics.filter((t) => t.difficulty === difficulty);
  }
  if (search) {
    const q = String(search).toLowerCase();
    topics = topics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, topics });
});

export const getTopicsBySubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subjectId } = req.params;
  const subject = await db.subjects.findById(subjectId);
  const allTopics = await db.topics.find();
  const filtered = allTopics.filter(
    (t) =>
      String(t.subject) === String(subjectId) ||
      (subject && t.subject.toLowerCase() === subject.name.toLowerCase()) ||
      t.subject.toLowerCase() === subjectId.toLowerCase()
  );
  res.json({ success: true, topics: filtered });
});

export const getTopicById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const topic = await db.topics.findById(req.params.id);
  if (!topic) {
    throw new AppError('Topic not found.', 404);
  }
  const userProgress = req.user
    ? await db.progress.findOne({ user: req.user._id, topic: topic.name })
    : null;
  const relatedNotes = req.user
    ? await db.notes.find({ user: req.user._id, topic: topic.name })
    : [];
  const relatedQuizzes = req.user
    ? await db.quizzes.find({ user: req.user._id, topic: topic.name })
    : [];

  res.json({
    success: true,
    topic,
    progress: userProgress,
    relatedNotes,
    relatedQuizzes: relatedQuizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      difficulty: q.difficulty,
      questionCount: q.questions?.length || 0,
      createdAt: q.createdAt,
    })),
  });
});

export const createTopic = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, name, description, difficulty, estimatedStudyTime, prerequisites, keyConcepts, contentSummary } =
    req.body;
  if (!subject || !name || !description) {
    throw new AppError('Subject, topic name, and description are required.', 400);
  }
  const created = await db.topics.create({
    subject: String(subject).trim(),
    name: String(name).trim(),
    description: String(description).trim(),
    difficulty: difficulty || 'Intermediate',
    estimatedStudyTime: Number(estimatedStudyTime) || 45,
    prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
    keyConcepts: Array.isArray(keyConcepts) ? keyConcepts : [],
    contentSummary: contentSummary || '',
  });
  res.status(201).json({ success: true, topic: created });
});

export const updateTopic = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, name, description, difficulty, estimatedStudyTime, prerequisites, keyConcepts, contentSummary } =
    req.body;
  const updates: Record<string, any> = {};
  if (subject !== undefined) updates.subject = String(subject).trim();
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = String(description).trim();
  if (difficulty !== undefined) updates.difficulty = String(difficulty);
  if (estimatedStudyTime !== undefined) updates.estimatedStudyTime = Math.max(5, Number(estimatedStudyTime) || 45);
  if (Array.isArray(prerequisites)) updates.prerequisites = prerequisites;
  if (Array.isArray(keyConcepts)) updates.keyConcepts = keyConcepts;
  if (contentSummary !== undefined) updates.contentSummary = String(contentSummary);

  const updated = await db.topics.updateById(req.params.id, updates);
  if (!updated) throw new AppError('Topic not found.', 404);
  res.json({ success: true, topic: updated });
});

export const deleteTopic = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await db.topics.deleteById(req.params.id);
  if (!deleted) throw new AppError('Topic not found.', 404);
  res.json({ success: true, message: 'Topic deleted.' });
});
