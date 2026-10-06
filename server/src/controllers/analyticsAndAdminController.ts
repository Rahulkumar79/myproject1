import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError, asyncHandler } from '../middleware/error.ts';
import { detectWeakTopicsForUser, generateUserRecommendations } from '../services/analyticsService.ts';

// PROGRESS & WEAK TOPICS
export const getProgressOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const progressList = await db.progress.find({ user: userId }, { sort: { updatedAt: -1 } });
  const sessions = await db.studySessions.find({ user: userId }, { sort: { createdAt: -1 } });
  const attempts = await db.quizAttempts.find({ user: userId }, { sort: { completedAt: -1 } });
  const tasks = await db.studyTasks.find({ user: userId });
  const weakTopics = await detectWeakTopicsForUser(userId);
  const strongTopics = progressList.filter((p) => (p.averageScore || 0) >= 80 || (p.completionPercentage || 0) >= 80);

  const totalStudyMinutes =
    sessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0) ||
    progressList.reduce((acc, p) => acc + (Number(p.studyTime) || 0), 0);

  const avgQuizScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + Number(a.percentage || 0), 0) / attempts.length)
      : 0;

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  // Build 7-day study time chart series
  const dailySeries = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const minutes = sessions
      .filter((s) => (s.startTime || s.createdAt || '').startsWith(dateStr))
      .reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    dailySeries.push({ date: dateStr, day: dayLabel, minutes, hours: Number((minutes / 60).toFixed(1)) });
  }

  // Subject-level aggregation
  const subjects = await db.subjects.find();
  const subjectProgress = subjects.map((subj) => {
    const subjRecords = progressList.filter((p) => p.subject === subj.name);
    const completion =
      subjRecords.length > 0
        ? Math.round(subjRecords.reduce((a, b) => a + Number(b.completionPercentage || 0), 0) / subjRecords.length)
        : 0;
    const studyMinutes = subjRecords.reduce((a, b) => a + Number(b.studyTime || 0), 0);
    const avgScore =
      subjRecords.filter((r) => r.quizAttempts > 0).length > 0
        ? Math.round(
            subjRecords.filter((r) => r.quizAttempts > 0).reduce((a, b) => a + Number(b.averageScore || 0), 0) /
              subjRecords.filter((r) => r.quizAttempts > 0).length
          )
        : 0;
    return {
      subject: subj.name,
      category: subj.category,
      completionPercentage: completion,
      studyMinutes,
      averageScore: avgScore,
      topicsTracked: subjRecords.length,
    };
  });

  res.json({
    success: true,
    summary: {
      totalStudyMinutes,
      totalStudyHours: Number((totalStudyMinutes / 60).toFixed(1)),
      subjectsStudied: subjectProgress.filter((s) => s.studyMinutes > 0 || s.completionPercentage > 0).length,
      topicsCompleted: progressList.filter((p) => (p.completionPercentage || 0) >= 80).length,
      tasksCompleted: completedTasks,
      tasksTotal: tasks.length,
      quizAttemptsCount: attempts.length,
      averageQuizScore: avgQuizScore,
    },
    progressList,
    subjectProgress,
    dailySeries,
    quizPerformanceSeries: attempts
      .slice(0, 10)
      .reverse()
      .map((a, idx) => ({
        attempt: `#${idx + 1}`,
        topic: (a.topic || 'Quiz').slice(0, 22),
        score: a.percentage,
        date: (a.completedAt || '').split('T')[0],
      })),
    weakTopics,
    strongTopics,
  });
});

export const getSubjectProgressList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const progressList = await db.progress.find({ user: req.user!._id });
  const subjects = await db.subjects.find();
  const subjectProgress = subjects.map((subj) => {
    const subjRecords = progressList.filter((p) => p.subject === subj.name);
    const completion =
      subjRecords.length > 0
        ? Math.round(subjRecords.reduce((a, b) => a + Number(b.completionPercentage || 0), 0) / subjRecords.length)
        : 0;
    const studyMinutes = subjRecords.reduce((a, b) => a + Number(b.studyTime || 0), 0);
    const avgScore =
      subjRecords.filter((r) => r.quizAttempts > 0).length > 0
        ? Math.round(
            subjRecords.filter((r) => r.quizAttempts > 0).reduce((a, b) => a + Number(b.averageScore || 0), 0) /
              subjRecords.filter((r) => r.quizAttempts > 0).length
          )
        : 0;
    return {
      subject: subj.name,
      subjectName: subj.name,
      subjectId: String(subj._id),
      category: subj.category,
      completionPercentage: completion,
      studyMinutes,
      averageScore: avgScore,
      topicsTracked: subjRecords.length,
    };
  });
  res.json({ success: true, progress: progressList, subjectProgress });
});

export const getTopicProgressList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const progressList = await db.progress.find({ user: req.user!._id });
  const weakTopics = await detectWeakTopicsForUser(req.user!._id);
  res.json({ success: true, topics: progressList, weakTopics });
});

export const getProgressBySubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subjectId } = req.params;
  const subject = await db.subjects.findById(subjectId);
  const subjectName = subject ? subject.name : subjectId;
  const records = await db.progress.find({ user: req.user!._id, subject: subjectName });
  res.json({ success: true, subject: subjectName, records });
});

export const markTopicStudied = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, topic, completionPercentage, durationMinutes } = req.body;
  if (!subject || !topic) {
    throw new AppError('Subject and topic are required.', 400);
  }
  const existing = await db.progress.findOne({ user: req.user!._id, topic });
  const duration = Number(durationMinutes) || 30;
  let record;
  if (existing) {
    record = await db.progress.updateById(String(existing._id), {
      completionPercentage:
        completionPercentage !== undefined ? Number(completionPercentage) : Math.min(100, (existing.completionPercentage || 0) + 25),
      studyTime: (existing.studyTime || 0) + duration,
      lastStudiedAt: new Date().toISOString(),
    });
  } else {
    record = await db.progress.create({
      user: req.user!._id,
      subject,
      topic,
      completionPercentage: completionPercentage !== undefined ? Number(completionPercentage) : 100,
      studyTime: duration,
      tasksCompleted: 1,
      tasksTotal: 1,
      quizAttempts: 0,
      averageScore: 0,
      lastStudiedAt: new Date().toISOString(),
    });
  }

  await db.activities.create({
    user: req.user!._id,
    activityType: 'topic_completed',
    title: `Studied Topic: ${topic} (${subject})`,
    subject,
    topic,
    referenceId: String(record?._id || ''),
  });

  res.json({ success: true, progress: record });
});

// STUDY SESSIONS
export const getStudySessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sessions = await db.studySessions.find({ user: req.user!._id }, { sort: { createdAt: -1 } });
  res.json({ success: true, sessions });
});

export const createStudySession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, topic, duration, activityType, notes, startTime, endTime } = req.body;
  if (!subject || !duration) {
    throw new AppError('Subject and duration (in minutes) are required.', 400);
  }
  const mins = Math.max(1, Number(duration));
  const end = endTime ? new Date(endTime) : new Date();
  const start = startTime ? new Date(startTime) : new Date(end.getTime() - mins * 60000);

  const session = await db.studySessions.create({
    user: req.user!._id,
    subject,
    topic: topic || '',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    duration: mins,
    activityType: activityType || 'reading',
    notes: notes || '',
  });

  // Update user streak
  const user = await db.users.findById(req.user!._id);
  if (user) {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextStreak = user.lastStudyDate === todayStr ? user.streakDays || 1 : (user.streakDays || 1) + 1;
    await db.users.updateById(req.user!._id, {
      streakDays: nextStreak,
      lastStudyDate: todayStr,
    });
  }

  if (topic) {
    const prog = await db.progress.findOne({ user: req.user!._id, topic });
    if (prog) {
      await db.progress.updateById(String(prog._id), {
        studyTime: (prog.studyTime || 0) + mins,
        completionPercentage: Math.min(100, (prog.completionPercentage || 0) + 15),
        lastStudiedAt: new Date().toISOString(),
      });
    } else {
      await db.progress.create({
        user: req.user!._id,
        subject,
        topic,
        completionPercentage: 25,
        studyTime: mins,
        tasksCompleted: 0,
        tasksTotal: 2,
        quizAttempts: 0,
        averageScore: 0,
        lastStudiedAt: new Date().toISOString(),
      });
    }
  }

  await db.activities.create({
    user: req.user!._id,
    activityType: 'study_session',
    title: `Logged ${mins}m Study Session on ${topic || subject}`,
    subject,
    topic: topic || '',
    referenceId: String(session._id),
  });

  res.status(201).json({ success: true, session });
});

export const getStudySessionsSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sessions = await db.studySessions.find({ user: req.user!._id });
  const totalMinutes = sessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  res.json({
    success: true,
    totalSessions: sessions.length,
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
  });
});

// ACTIVITIES & LEARNING HISTORY
export const getActivities = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type } = req.query;
  const filter: Record<string, any> = { user: req.user!._id };
  if (type && type !== 'all') {
    filter.activityType = String(type);
  }
  const activities = await db.activities.find(filter, { sort: { createdAt: -1 }, limit: 100 });
  res.json({ success: true, activities });
});

export const getRecentActivities = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const activities = await db.activities.find({ user: req.user!._id }, { sort: { createdAt: -1 }, limit: 12 });
  res.json({ success: true, activities });
});

// RECOMMENDATIONS
export const getRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const recs = await generateUserRecommendations(req.user!._id);
  const weakTopics = await detectWeakTopicsForUser(req.user!._id);
  res.json({ success: true, recommendations: recs, weakTopics });
});

export const refreshRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await db.recommendations.deleteMany({ user: req.user!._id });
  const recs = await generateUserRecommendations(req.user!._id);
  const weakTopics = await detectWeakTopicsForUser(req.user!._id);
  res.json({ success: true, recommendations: recs, weakTopics });
});

export const updateRecommendationStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rec = await db.recommendations.findById(req.params.id);
  if (!rec || String(rec.user) !== req.user!._id) {
    throw new AppError('Recommendation not found.', 404);
  }
  const updated = await db.recommendations.updateById(req.params.id, {
    status: req.body.status || 'completed',
  });
  res.json({ success: true, recommendation: updated });
});

// DASHBOARD AGGREGATOR
export const getStudentDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const user = await db.users.findById(userId);
  const sessions = await db.studySessions.find({ user: userId }, { sort: { createdAt: -1 } });
  const progressList = await db.progress.find({ user: userId });
  const tasks = await db.studyTasks.find({ user: userId }, { sort: { scheduledDate: 1 } });
  const attempts = await db.quizAttempts.find({ user: userId }, { sort: { completedAt: -1 } });
  const goals = await db.goals.find({ user: userId });
  const activities = await db.activities.find({ user: userId }, { sort: { createdAt: -1 }, limit: 8 });
  const weakTopics = await detectWeakTopicsForUser(userId);
  const recommendations = await generateUserRecommendations(userId);

  const subjects = await db.subjects.find();
  const allTopics = await db.topics.find();
  const totalTopicsCount = allTopics.length > 0 ? allTopics.length : 32;

  const totalStudyMinutes =
    sessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0) ||
    progressList.reduce((acc, p) => acc + (Number(p.studyTime) || 0), 0);

  const avgQuizScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + Number(a.percentage || 0), 0) / attempts.length)
      : 0;

  const dailySeries = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const minutes = sessions
      .filter((s) => (s.startTime || s.createdAt || '').startsWith(dateStr))
      .reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    dailySeries.push({
      date: dateStr,
      day: dayLabel,
      label: dayLabel,
      minutes,
      hours: Number((minutes / 60).toFixed(1)),
    });
  }

  // Subject-level mastery breakdown
  const subjectProgress = subjects.map((subj) => {
    const subjRecords = progressList.filter((p) => p.subject === subj.name);
    const completion =
      subjRecords.length > 0
        ? Math.round(subjRecords.reduce((a, b) => a + Number(b.completionPercentage || 0), 0) / subjRecords.length)
        : 0;
    const studyMinutes = subjRecords.reduce((a, b) => a + Number(b.studyTime || 0), 0);
    const avgScore =
      subjRecords.filter((r) => r.quizAttempts > 0).length > 0
        ? Math.round(
            subjRecords.filter((r) => r.quizAttempts > 0).reduce((a, b) => a + Number(b.averageScore || 0), 0) /
              subjRecords.filter((r) => r.quizAttempts > 0).length
          )
        : 0;
    return {
      subject: subj.name,
      subjectName: subj.name,
      subjectId: String(subj._id),
      category: subj.category,
      completionPercentage: completion,
      studyMinutes,
      averageScore: avgScore,
      topicsTracked: subjRecords.length,
    };
  });

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completedTopicsCount = progressList.filter((p) => (p.completionPercentage || 0) >= 80).length;
  const overallCompletionPercentage =
    progressList.length > 0
      ? Math.round(
          progressList.reduce((acc, p) => acc + Number(p.completionPercentage || 0), 0) / totalTopicsCount
        )
      : 0;

  const stats = {
    totalStudyMinutes,
    totalStudyHours: Number((totalStudyMinutes / 60).toFixed(1)),
    streakDays: user?.streakDays || 1,
    averageQuizScore: avgQuizScore,
    quizAttemptsCount: attempts.length,
    quizzesTaken: attempts.length,
    completedTasksCount: completedTasks,
    completedTasks,
    pendingTasksCount: tasks.length - completedTasks,
    totalTasks: tasks.length,
    topicsMasteredCount: completedTopicsCount,
    completedTopicsCount,
    totalTopicsCount,
    overallCompletionPercentage: Math.min(100, overallCompletionPercentage),
  };

  // Flashcards Summary
  const userDecks = await db.flashcardDecks.find({ user: userId }, { sort: { lastStudiedAt: -1, createdAt: -1 } });
  const userFlashcards = await db.flashcards.find({ user: userId });
  const nowMs = Date.now();
  const dueTodayCardsCount = userFlashcards.filter((c) => new Date(c.dueAt).getTime() <= nowMs).length;
  const masteredCardsCount = userFlashcards.filter((c) => c.status === 'mastered').length;

  const flashcardsSummary = {
    totalDecks: userDecks.length,
    totalCards: userFlashcards.length,
    dueTodayCount: dueTodayCardsCount,
    masteredCount: masteredCardsCount,
    recentDeck: userDecks[0] || null,
  };

  const dashboardPayload = {
    stats,
    weeklyStudyChart: dailySeries,
    dailySeries,
    subjectProgress,
    progressList,
    upcomingTasks: tasks.filter((t) => t.status !== 'completed').slice(0, 5),
    weakTopics: weakTopics.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    goals,
    recentActivities: activities,
    flashcardsSummary,
  };

  res.json({
    success: true,
    dashboard: dashboardPayload,
    ...dashboardPayload,
  });
});

// GLOBAL SEARCH (Only returns authorized user data + public subjects/topics)
export const globalSearch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.type || 'all').toLowerCase();
  const userId = req.user!._id;

  if (!q) {
    return res.json({
      success: true,
      results: { subjects: [], topics: [], notes: [], documents: [], quizzes: [], conversations: [] },
      totalCount: 0,
    });
  }

  const [subjects, topics, notes, documents, quizzes, conversations] = await Promise.all([
    category === 'all' || category === 'subjects' ? db.subjects.find() : Promise.resolve([]),
    category === 'all' || category === 'topics' ? db.topics.find() : Promise.resolve([]),
    category === 'all' || category === 'notes' ? db.notes.find({ user: userId }) : Promise.resolve([]),
    category === 'all' || category === 'documents' ? db.documents.find({ user: userId }) : Promise.resolve([]),
    category === 'all' || category === 'quizzes' ? db.quizzes.find({ user: userId }) : Promise.resolve([]),
    category === 'all' || category === 'conversations' ? db.conversations.find({ user: userId }) : Promise.resolve([]),
  ]);

  const matchedSubjects = subjects.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  );
  const matchedTopics = topics.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
  );
  const matchedNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.topic.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
  );
  const matchedDocs = documents
    .filter(
      (d) =>
        d.originalName.toLowerCase().includes(q) ||
        (d.subject || '').toLowerCase().includes(q) ||
        (d.extractedText || '').toLowerCase().includes(q)
    )
    .map(({ extractedText, filePath, ...rest }) => rest);
  const matchedQuizzes = quizzes
    .filter((qz) => qz.title.toLowerCase().includes(q) || qz.topic.toLowerCase().includes(q))
    .map(({ questions, ...rest }) => ({ ...rest, questionCount: questions?.length || 0 }));
  const matchedConversations = conversations.filter(
    (c) => c.title.toLowerCase().includes(q) || (c.topic || '').toLowerCase().includes(q)
  );

  const totalCount =
    matchedSubjects.length +
    matchedTopics.length +
    matchedNotes.length +
    matchedDocs.length +
    matchedQuizzes.length +
    matchedConversations.length;

  res.json({
    success: true,
    results: {
      subjects: matchedSubjects,
      topics: matchedTopics,
      notes: matchedNotes,
      documents: matchedDocs,
      quizzes: matchedQuizzes,
      conversations: matchedConversations,
    },
    totalCount,
  });
});

// ADMIN DASHBOARD CONTROLLERS
export const getAdminOverview = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const [users, subjects, topics, documents, quizzes, attempts, conversations, messages, activities, sessions] =
    await Promise.all([
      db.users.find({}, { sort: { createdAt: -1 } }),
      db.subjects.find(),
      db.topics.find(),
      db.documents.find({}, { sort: { createdAt: -1 } }),
      db.quizzes.find(),
      db.quizAttempts.find(),
      db.conversations.find(),
      db.messages.find(),
      db.activities.find({}, { sort: { createdAt: -1 }, limit: 30 }),
      db.studySessions.find(),
    ]);

  const activeUsers = users.filter((u) => u.isActive !== false).length;
  const avgQuizScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((a, b) => a + Number(b.percentage || 0), 0) / attempts.length)
      : 0;
  const totalStudyMinutes = sessions.reduce((a, b) => a + Number(b.duration || 0), 0);

  res.json({
    success: true,
    metrics: {
      totalUsers: users.length,
      activeUsers,
      disabledUsers: users.length - activeUsers,
      totalSubjects: subjects.length,
      totalTopics: topics.length,
      totalDocuments: documents.length,
      totalQuizzes: quizzes.length,
      totalQuizAttempts: attempts.length,
      aiConversationsCount: conversations.length,
      aiMessagesCount: messages.length,
      averageQuizScore: avgQuizScore,
      totalStudyHours: Number((totalStudyMinutes / 60).toFixed(1)),
    },
    recentUsers: users.slice(0, 8).map(({ password, tokenVersion, ...u }) => u),
    recentActivities: activities.slice(0, 12),
    subjectDistribution: subjects.map((s) => ({
      name: s.name,
      topics: topics.filter((t) => t.subject === s.name).length,
      quizzes: quizzes.filter((q) => q.subject === s.name).length,
    })),
  });
});

export const getAdminUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const users = await db.users.find({}, { sort: { createdAt: -1 } });
  const sanitized = users.map(({ password, tokenVersion, ...rest }) => rest);
  res.json({ success: true, users: sanitized });
});

export const toggleAdminUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const target = await db.users.findById(req.params.id);
  if (!target) {
    throw new AppError('User not found.', 404);
  }
  if (String(target._id) === req.user!._id) {
    throw new AppError('You cannot disable your own administrator account.', 400);
  }
  const nextStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : target.isActive === false;
  const updated = await db.users.updateById(req.params.id, { isActive: nextStatus });
  if (!updated) {
    throw new AppError('User not found.', 404);
  }
  const { password, tokenVersion, ...safeUser } = updated;
  res.json({ success: true, user: safeUser });
});

export const getAdminUserActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await db.users.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  const activities = await db.activities.find({ user: String(user._id) }, { sort: { createdAt: -1 }, limit: 50 });
  const attempts = await db.quizAttempts.find({ user: String(user._id) }, { sort: { completedAt: -1 } });
  const { password, tokenVersion, ...safeUser } = user;
  res.json({ success: true, user: safeUser, activities, quizAttempts: attempts });
});

export const getAdminDocuments = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const docs = await db.documents.find({}, { sort: { createdAt: -1 } });
  const users = await db.users.find();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const enriched = docs.map(({ extractedText, filePath, ...d }) => ({
    ...d,
    ownerName: userMap.get(String(d.user))?.name || 'Student',
    ownerEmail: userMap.get(String(d.user))?.email || '',
  }));

  res.json({ success: true, documents: enriched });
});

export const deleteAdminDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const doc = await db.documents.findById(req.params.id);
  if (!doc) throw new AppError('Document not found.', 404);
  await db.documents.deleteById(req.params.id);
  await db.documentChunks.deleteMany({ document: String(doc._id) });
  res.json({ success: true, message: 'Document removed by administrator.' });
});
