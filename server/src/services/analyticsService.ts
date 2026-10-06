import { db } from '../config/db.ts';

export interface WeakTopicItem {
  topic: string;
  subject: string;
  averageScore: number;
  completionPercentage: number;
  quizAttempts: number;
  incorrectCount: number;
  lastStudiedAt: string;
  daysSinceLastStudy: number | null;
  severity: 'high' | 'medium';
  reasons: string[];
}

export async function detectWeakTopicsForUser(userId: string): Promise<WeakTopicItem[]> {
  const progressRecords = await db.progress.find({ user: userId });
  const quizAttempts = await db.quizAttempts.find({ user: userId });

  // Aggregate quiz stats by topic
  const topicQuizStats = new Map<
    string,
    { subject: string; scores: number[]; incorrectAnswers: number; lastCompletedAt: string }
  >();

  for (const attempt of quizAttempts) {
    const tName = attempt.topic || 'General';
    const existing = topicQuizStats.get(tName) || {
      subject: attempt.subject || 'General',
      scores: [] as number[],
      incorrectAnswers: 0,
      lastCompletedAt: attempt.completedAt || attempt.createdAt,
    };
    existing.scores.push(Number(attempt.percentage || 0));
    const wrongInAttempt = Array.isArray(attempt.answers)
      ? attempt.answers.filter((a: any) => !a.isCorrect).length
      : 0;
    existing.incorrectAnswers += wrongInAttempt;
    if ((attempt.completedAt || '') > existing.lastCompletedAt) {
      existing.lastCompletedAt = attempt.completedAt;
    }
    topicQuizStats.set(tName, existing);
  }

  const allTopicsMap = new Map<string, WeakTopicItem>();
  const now = Date.now();

  for (const prog of progressRecords) {
    const qStat = topicQuizStats.get(prog.topic);
    const avgScore =
      qStat && qStat.scores.length > 0
        ? Math.round(qStat.scores.reduce((a, b) => a + b, 0) / qStat.scores.length)
        : Number(prog.averageScore || 0);
    const attemptsCount = qStat ? qStat.scores.length : Number(prog.quizAttempts || 0);
    const incorrectCount = qStat ? qStat.incorrectAnswers : Number(prog.incorrectCount || 0);
    const completion = Number(prog.completionPercentage || 0);
    const lastStudied = prog.lastStudiedAt || qStat?.lastCompletedAt || prog.updatedAt || '';

    const daysSince = lastStudied
      ? Math.floor((now - new Date(lastStudied).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const reasons: string[] = [];
    if (attemptsCount > 0 && avgScore < 68) {
      reasons.push(`Low quiz average of ${avgScore}% across ${attemptsCount} attempt(s)`);
    }
    if (incorrectCount >= 2) {
      reasons.push(`${incorrectCount} incorrect quiz answers recorded on this topic`);
    }
    if (completion < 45) {
      reasons.push(`Low topic completion (${completion}%) — core study tasks remain unfinished`);
    }
    if (daysSince !== null && daysSince >= 5) {
      reasons.push(`${daysSince} days since last study session — high risk of forgetting`);
    }

    if (reasons.length > 0) {
      allTopicsMap.set(prog.topic, {
        topic: prog.topic,
        subject: prog.subject,
        averageScore: avgScore,
        completionPercentage: completion,
        quizAttempts: attemptsCount,
        incorrectCount,
        lastStudiedAt: lastStudied,
        daysSinceLastStudy: daysSince,
        severity: (attemptsCount > 0 && avgScore < 55) || reasons.length >= 2 ? 'high' : 'medium',
        reasons,
      });
    }
  }

  // Also check quizAttempts for topics that don't have a progress record yet
  for (const [topicName, qStat] of topicQuizStats.entries()) {
    if (allTopicsMap.has(topicName)) continue;
    const avgScore = Math.round(qStat.scores.reduce((a, b) => a + b, 0) / qStat.scores.length);
    const reasons: string[] = [];
    if (avgScore < 68) {
      reasons.push(`Quiz average is ${avgScore}% across ${qStat.scores.length} attempt(s)`);
    }
    if (qStat.incorrectAnswers >= 2) {
      reasons.push(`${qStat.incorrectAnswers} incorrect quiz responses need review`);
    }
    if (reasons.length > 0) {
      allTopicsMap.set(topicName, {
        topic: topicName,
        subject: qStat.subject,
        averageScore: avgScore,
        completionPercentage: 30,
        quizAttempts: qStat.scores.length,
        incorrectCount: qStat.incorrectAnswers,
        lastStudiedAt: qStat.lastCompletedAt,
        daysSinceLastStudy: 0,
        severity: avgScore < 55 ? 'high' : 'medium',
        reasons,
      });
    }
  }

  return Array.from(allTopicsMap.values()).sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    return a.averageScore - b.averageScore;
  });
}

export async function generateUserRecommendations(userId: string): Promise<any[]> {
  const weakTopics = await detectWeakTopicsForUser(userId);
  const notes = await db.notes.find({ user: userId });
  const documents = await db.documents.find({ user: userId });
  const pendingTasks = await db.studyTasks.find({ user: userId, status: 'pending' });
  const existingRecs = await db.recommendations.find({ user: userId, status: 'active' });

  if (existingRecs.length >= 4) {
    return existingRecs;
  }

  // Rebuild fresh factual recommendations
  await db.recommendations.deleteMany({ user: userId, status: 'active' });
  const newRecs: Array<Record<string, any>> = [];

  for (const wt of weakTopics.slice(0, 2)) {
    newRecs.push({
      user: userId,
      type: 'review_topic',
      title: `Review Weak Topic: ${wt.topic}`,
      description: `Open the AI Tutor in Beginner or Exam Preparation mode to clarify misconceptions in ${wt.topic} (${wt.subject}).`,
      reason: wt.reasons.join(' · '),
      priority: wt.severity === 'high' ? 'high' : 'medium',
      relatedSubject: wt.subject,
      relatedTopic: wt.topic,
      actionUrl: `/ai-tutor?subject=${encodeURIComponent(wt.subject)}&topic=${encodeURIComponent(wt.topic)}`,
      status: 'active',
    });

    newRecs.push({
      user: userId,
      type: 'take_quiz',
      title: `Retake Diagnostic Quiz: ${wt.topic}`,
      description: `Take a targeted 5-question practice quiz on ${wt.topic} to raise your mastery score above 80%.`,
      reason: `Current average score is ${wt.averageScore}% (${wt.incorrectCount} incorrect answers logged)`,
      priority: 'high',
      relatedSubject: wt.subject,
      relatedTopic: wt.topic,
      actionUrl: `/quiz/create?subject=${encodeURIComponent(wt.subject)}&topic=${encodeURIComponent(wt.topic)}`,
      status: 'active',
    });
  }

  if (documents.length > 0) {
    const latestDoc = documents[0];
    newRecs.push({
      user: userId,
      type: 'study_document',
      title: `Ask RAG Questions on "${latestDoc.originalName}"`,
      description: `Test your comprehension of your uploaded study material (${latestDoc.pageCount} page(s), ${latestDoc.chunkCount} indexed chunks).`,
      reason: `Uploaded document "${latestDoc.originalName}" is indexed and ready for grounded Q&A`,
      priority: 'medium',
      relatedSubject: latestDoc.subject || 'DBMS',
      relatedTopic: latestDoc.originalName,
      actionUrl: `/documents/${latestDoc._id}`,
      status: 'active',
    });
  }

  if (notes.length > 0) {
    const latestNote = notes[0];
    newRecs.push({
      user: userId,
      type: 'read_notes',
      title: `Quick Revision: ${latestNote.title}`,
      description: `Review the key concepts, common mistakes, and high-yield exam questions in your saved notes.`,
      reason: `Spaced repetition of your saved ${latestNote.subject} notes improves long-term retention`,
      priority: 'low',
      relatedSubject: latestNote.subject,
      relatedTopic: latestNote.topic,
      actionUrl: `/notes/${latestNote._id}`,
      status: 'active',
    });
  }

  if (pendingTasks.length > 0) {
    const nextTask = pendingTasks[0];
    newRecs.push({
      user: userId,
      type: 'study_topic',
      title: `Complete Scheduled Task: ${nextTask.title}`,
      description: `Stay on track with your study plan (${nextTask.estimatedDuration} min scheduled on ${nextTask.scheduledDate}).`,
      reason: `Pending ${nextTask.priority}-priority task in your active study schedule`,
      priority: nextTask.priority || 'medium',
      relatedSubject: nextTask.subject || 'Computer Science',
      relatedTopic: nextTask.topic || nextTask.title,
      actionUrl: `/tasks`,
      status: 'active',
    });
  }

  // Flashcards recommendation if user has cards due
  const userCards = await db.flashcards.find({ user: userId });
  const dueCount = userCards.filter((c) => new Date(c.dueAt).getTime() <= Date.now()).length;
  if (dueCount > 0) {
    newRecs.push({
      user: userId,
      type: 'review_flashcards',
      title: `Review ${dueCount} Due Flashcard${dueCount > 1 ? 's' : ''}`,
      description: `Active recall spaced repetition session scheduled for today to lock in your memory retention.`,
      reason: `${dueCount} card${dueCount > 1 ? 's are' : ' is'} due for spaced repetition review`,
      priority: 'high',
      relatedSubject: userCards[0]?.deck ? 'Spaced Repetition' : 'Active Recall',
      relatedTopic: 'Flashcard Review',
      actionUrl: `/flashcards`,
      status: 'active',
    });
  }

  newRecs.push({
    user: userId,
    type: 'interview_prep',
    title: `Practice Technical Interview Scenarios`,
    description: `Switch the AI Tutor to "Interview Preparation" mode to practice complexity analysis and system trade-offs.`,
    reason: `Recommended weekly interview readiness drill based on your curriculum`,
    priority: 'medium',
    relatedSubject: 'Data Structures & Algorithms',
    relatedTopic: 'Trees, Graphs & Dynamic Programming',
    actionUrl: `/ai-tutor?mode=Interview%20Preparation`,
    status: 'active',
  });

  const created = await db.recommendations.insertMany(newRecs.slice(0, 6));
  return created;
}
