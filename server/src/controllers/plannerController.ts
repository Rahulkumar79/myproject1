import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError, asyncHandler } from '../middleware/error.ts';
import { generateStudyPlanTasks } from '../services/aiService.ts';

// LEARNING GOALS
export const getGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const goals = await db.goals.find({ user: req.user!._id }, { sort: { createdAt: -1 } });
  res.json({ success: true, goals });
});

export const getGoalById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const goal = await db.goals.findById(req.params.id);
  if (!goal || String(goal.user) !== req.user!._id) {
    throw new AppError('Learning goal not found.', 404);
  }
  res.json({ success: true, goal });
});

export const createGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, targetDate, targetType, targetValue, currentValue } = req.body;
  if (!title || !targetDate || !targetValue) {
    throw new AppError('Title, target date, and target value are required.', 400);
  }
  const goal = await db.goals.create({
    user: req.user!._id,
    title: String(title).trim(),
    description: description || '',
    targetDate,
    targetType: targetType || 'hours',
    targetValue: Number(targetValue),
    currentValue: Number(currentValue) || 0,
    status: 'active',
  });
  res.status(201).json({ success: true, goal });
});

export const updateGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.goals.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Learning goal not found.', 404);
  }
  const nextVal = req.body.currentValue !== undefined ? Number(req.body.currentValue) : existing.currentValue;
  const targetVal = req.body.targetValue !== undefined ? Number(req.body.targetValue) : existing.targetValue;
  const autoStatus = nextVal >= targetVal ? 'completed' : req.body.status || existing.status;

  const updates: Record<string, any> = {
    currentValue: nextVal,
    targetValue: targetVal,
    status: autoStatus,
  };
  if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
  if (req.body.description !== undefined) updates.description = String(req.body.description);
  if (req.body.targetDate !== undefined) updates.targetDate = String(req.body.targetDate);
  if (req.body.targetType !== undefined) updates.targetType = String(req.body.targetType);

  const updated = await db.goals.updateById(req.params.id, updates);
  res.json({ success: true, goal: updated });
});

export const deleteGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.goals.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Learning goal not found.', 404);
  }
  await db.goals.deleteById(req.params.id);
  res.json({ success: true, message: 'Goal deleted.' });
});

// STUDY PLANS
export const getStudyPlans = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const plans = await db.studyPlans.find({ user: req.user!._id }, { sort: { createdAt: -1 } });
  const allTasks = await db.studyTasks.find({ user: req.user!._id });

  const enriched = plans.map((plan) => {
    const planTasks = allTasks.filter((t) => String(t.studyPlan) === String(plan._id));
    const completed = planTasks.filter((t) => t.status === 'completed').length;
    return {
      ...plan,
      taskCount: planTasks.length,
      completedTaskCount: completed,
      completionPercentage: planTasks.length > 0 ? Math.round((completed / planTasks.length) * 100) : 0,
    };
  });

  res.json({ success: true, studyPlans: enriched });
});

export const getStudyPlanById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const plan = await db.studyPlans.findById(req.params.id);
  if (!plan || String(plan.user) !== req.user!._id) {
    throw new AppError('Study plan not found.', 404);
  }
  const tasks = await db.studyTasks.find(
    { user: req.user!._id, studyPlan: String(plan._id) },
    { sort: { scheduledDate: 1 } }
  );
  res.json({ success: true, studyPlan: plan, tasks });
});

export const createStudyPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    subjects,
    topics,
    weakSubjects,
    dailyHours,
    startDate,
    examDate,
    knowledgeLevel,
    targetScore,
    preferredStudyTime,
    goals,
  } = req.body;

  if (!title) {
    throw new AppError('Study plan title is required.', 400);
  }

  const start = startDate || new Date().toISOString().split('T')[0];
  const end = examDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const subjList = Array.isArray(subjects) && subjects.length > 0 ? subjects : ['DBMS', 'Operating Systems'];
  const topicList = Array.isArray(topics) ? topics : [];
  const weakList = Array.isArray(weakSubjects) ? weakSubjects : [];

  const generated = await generateStudyPlanTasks({
    title,
    subjects: subjList,
    topics: topicList,
    weakSubjects: weakList,
    dailyHours: Number(dailyHours) || 3,
    startDate: start,
    examDate: end,
    knowledgeLevel: knowledgeLevel || 'Intermediate',
    preferredStudyTime: preferredStudyTime || 'Morning',
  });

  const plan = await db.studyPlans.create({
    user: req.user!._id,
    title: String(title).trim(),
    description: generated.description,
    startDate: start,
    endDate: end,
    examDate: end,
    dailyHours: Number(dailyHours) || 3,
    knowledgeLevel: knowledgeLevel || 'Intermediate',
    targetScore: Number(targetScore) || 85,
    subjects: subjList,
    weakSubjects: weakList,
    preferredStudyTime: preferredStudyTime || 'Morning',
    goals: Array.isArray(goals) ? goals : [`Achieve ${targetScore || 85}% target score`],
    weeklySummary: generated.weeklySummary,
    status: 'active',
  });

  const createdTasks = [];
  for (const t of generated.tasks) {
    const taskDoc = await db.studyTasks.create({
      user: req.user!._id,
      studyPlan: String(plan._id),
      subject: t.subject,
      topic: t.topic,
      title: t.title,
      description: t.description,
      taskType: t.taskType,
      scheduledDate: t.scheduledDate,
      estimatedDuration: t.estimatedDuration,
      priority: t.priority,
      status: 'pending',
    });
    createdTasks.push(taskDoc);
  }

  await db.activities.create({
    user: req.user!._id,
    activityType: 'plan_created',
    title: `Generated AI Study Plan: ${plan.title}`,
    subject: subjList.join(', '),
    referenceId: String(plan._id),
  });

  res.status(201).json({
    success: true,
    studyPlan: plan,
    tasks: createdTasks,
  });
});

export const updateStudyPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.studyPlans.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Study plan not found.', 404);
  }

  if (req.body.regenerate) {
    await db.studyTasks.deleteMany({ user: req.user!._id, studyPlan: String(existing._id), status: 'pending' });
    const generated = await generateStudyPlanTasks({
      title: req.body.title || existing.title,
      subjects: req.body.subjects || existing.subjects || ['DBMS'],
      topics: req.body.topics || [],
      weakSubjects: req.body.weakSubjects || existing.weakSubjects || [],
      dailyHours: Number(req.body.dailyHours || existing.dailyHours || 3),
      startDate: new Date().toISOString().split('T')[0],
      examDate: req.body.examDate || existing.examDate,
      knowledgeLevel: req.body.knowledgeLevel || existing.knowledgeLevel || 'Intermediate',
      preferredStudyTime: req.body.preferredStudyTime || existing.preferredStudyTime || 'Morning',
    });

    for (const t of generated.tasks) {
      await db.studyTasks.create({
        user: req.user!._id,
        studyPlan: String(existing._id),
        subject: t.subject,
        topic: t.topic,
        title: t.title,
        description: t.description,
        taskType: t.taskType,
        scheduledDate: t.scheduledDate,
        estimatedDuration: t.estimatedDuration,
        priority: t.priority,
        status: 'pending',
      });
    }
  }

  const planUpdates: Record<string, any> = {};
  if (req.body.title !== undefined) planUpdates.title = String(req.body.title).trim();
  if (req.body.description !== undefined) planUpdates.description = String(req.body.description);
  if (req.body.startDate !== undefined) planUpdates.startDate = String(req.body.startDate);
  if (req.body.endDate !== undefined) planUpdates.endDate = String(req.body.endDate);
  if (req.body.examDate !== undefined) planUpdates.examDate = String(req.body.examDate);
  if (req.body.dailyHours !== undefined) planUpdates.dailyHours = Math.max(1, Number(req.body.dailyHours) || 3);
  if (req.body.knowledgeLevel !== undefined) planUpdates.knowledgeLevel = String(req.body.knowledgeLevel);
  if (req.body.targetScore !== undefined) planUpdates.targetScore = Number(req.body.targetScore) || 85;
  if (Array.isArray(req.body.subjects)) planUpdates.subjects = req.body.subjects;
  if (Array.isArray(req.body.weakSubjects)) planUpdates.weakSubjects = req.body.weakSubjects;
  if (req.body.preferredStudyTime !== undefined) planUpdates.preferredStudyTime = String(req.body.preferredStudyTime);
  if (Array.isArray(req.body.goals)) planUpdates.goals = req.body.goals;
  if (req.body.status !== undefined) planUpdates.status = String(req.body.status);

  const updated = await db.studyPlans.updateById(req.params.id, planUpdates);
  const tasks = await db.studyTasks.find({ user: req.user!._id, studyPlan: String(existing._id) });
  res.json({ success: true, studyPlan: updated, tasks });
});

export const deleteStudyPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.studyPlans.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Study plan not found.', 404);
  }
  await db.studyPlans.deleteById(req.params.id);
  await db.studyTasks.deleteMany({ user: req.user!._id, studyPlan: String(existing._id) });
  res.json({ success: true, message: 'Study plan and scheduled tasks deleted.' });
});

// STUDY TASKS
export const getStudyTasks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { studyPlan, status, priority } = req.query;
  const filter: Record<string, any> = { user: req.user!._id };
  if (studyPlan) filter.studyPlan = String(studyPlan);
  if (status && status !== 'all') filter.status = String(status);
  if (priority && priority !== 'all') filter.priority = String(priority);

  const tasks = await db.studyTasks.find(filter, { sort: { scheduledDate: 1 } });
  res.json({ success: true, tasks });
});

export const getStudyTaskById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const task = await db.studyTasks.findById(req.params.id);
  if (!task || String(task.user) !== req.user!._id) {
    throw new AppError('Study task not found.', 404);
  }
  res.json({ success: true, task });
});

export const createStudyTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { studyPlan, subject, topic, title, description, taskType, scheduledDate, estimatedDuration, priority } =
    req.body;
  if (!title) {
    throw new AppError('Task title is required.', 400);
  }
  const task = await db.studyTasks.create({
    user: req.user!._id,
    studyPlan: studyPlan || '',
    subject: subject || 'General',
    topic: topic || '',
    title: String(title).trim(),
    description: description || '',
    taskType: taskType || 'study',
    scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
    estimatedDuration: Number(estimatedDuration) || 45,
    priority: priority || 'medium',
    status: 'pending',
  });
  res.status(201).json({ success: true, task });
});

export const updateStudyTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.studyTasks.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Study task not found.', 404);
  }
  const taskUpdates: Record<string, any> = {};
  if (req.body.title !== undefined) taskUpdates.title = String(req.body.title).trim();
  if (req.body.description !== undefined) taskUpdates.description = String(req.body.description);
  if (req.body.subject !== undefined) taskUpdates.subject = String(req.body.subject);
  if (req.body.topic !== undefined) taskUpdates.topic = String(req.body.topic);
  if (req.body.taskType !== undefined) taskUpdates.taskType = String(req.body.taskType);
  if (req.body.scheduledDate !== undefined) taskUpdates.scheduledDate = String(req.body.scheduledDate);
  if (req.body.estimatedDuration !== undefined) taskUpdates.estimatedDuration = Math.max(5, Number(req.body.estimatedDuration) || 45);
  if (req.body.priority !== undefined) taskUpdates.priority = String(req.body.priority);
  if (req.body.status !== undefined) taskUpdates.status = String(req.body.status);

  const updated = await db.studyTasks.updateById(req.params.id, taskUpdates);
  res.json({ success: true, task: updated });
});

export const updateStudyTaskStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.studyTasks.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Study task not found.', 404);
  }

  const { status } = req.body;
  if (!['pending', 'in-progress', 'completed'].includes(status)) {
    throw new AppError('Invalid task status.', 400);
  }

  const completedAt = status === 'completed' ? new Date().toISOString() : '';
  const updated = await db.studyTasks.updateById(req.params.id, { status, completedAt });

  if (status === 'completed' && existing.status !== 'completed') {
    await db.activities.create({
      user: req.user!._id,
      activityType: 'task_completed',
      title: `Completed Study Task: ${existing.title}`,
      subject: existing.subject,
      topic: existing.topic,
      referenceId: String(existing._id),
    });

    // Update topic progress if applicable
    if (existing.topic) {
      const prog = await db.progress.findOne({ user: req.user!._id, topic: existing.topic });
      if (prog) {
        const nextCompleted = (prog.tasksCompleted || 0) + 1;
        const nextTotal = Math.max(prog.tasksTotal || 4, nextCompleted);
        await db.progress.updateById(String(prog._id), {
          tasksCompleted: nextCompleted,
          tasksTotal: nextTotal,
          completionPercentage: Math.min(100, Math.round((nextCompleted / nextTotal) * 100)),
          studyTime: (prog.studyTime || 0) + (Number(existing.estimatedDuration) || 30),
          lastStudiedAt: new Date().toISOString(),
        });
      } else {
        await db.progress.create({
          user: req.user!._id,
          subject: existing.subject || 'General',
          topic: existing.topic,
          completionPercentage: 50,
          studyTime: Number(existing.estimatedDuration) || 30,
          tasksCompleted: 1,
          tasksTotal: 2,
          quizAttempts: 0,
          averageScore: 0,
          lastStudiedAt: new Date().toISOString(),
        });
      }
    }
  }

  res.json({ success: true, task: updated });
});

export const deleteStudyTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.studyTasks.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Study task not found.', 404);
  }
  await db.studyTasks.deleteById(req.params.id);
  res.json({ success: true, message: 'Task deleted.' });
});
