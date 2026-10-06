import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError, asyncHandler } from '../middleware/error.ts';
import {
  generateTutorResponse,
  generateStructuredNotes,
  generateQuizQuestions,
} from '../services/aiService.ts';
import { extractDocumentText } from '../utils/textExtractor.ts';
import { processDocumentIntoChunks, answerQuestionWithRAG } from '../services/ragService.ts';

// 1. AI TUTOR CONTROLLERS
export const getConversations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const conversations = await db.conversations.find({ user: req.user!._id }, { sort: { updatedAt: -1 } });
  res.json({ success: true, conversations });
});

export const createConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, mode, subject, topic } = req.body;
  const conv = await db.conversations.create({
    user: req.user!._id,
    title: title ? String(title).trim() : topic ? `${topic} (${mode || 'Intermediate'})` : 'New AI Tutor Session',
    mode: mode || 'Intermediate',
    subject: subject || '',
    topic: topic || '',
  });
  res.status(201).json({ success: true, conversation: conv });
});

export const getConversationById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const conv = await db.conversations.findById(req.params.id);
  if (!conv || String(conv.user) !== req.user!._id) {
    throw new AppError('Conversation not found.', 404);
  }
  const messages = await db.messages.find({ conversation: String(conv._id) }, { sort: { createdAt: 1 } });
  res.json({ success: true, conversation: conv, messages });
});

export const updateConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const conv = await db.conversations.findById(req.params.id);
  if (!conv || String(conv.user) !== req.user!._id) {
    throw new AppError('Conversation not found.', 404);
  }
  const updated = await db.conversations.updateById(req.params.id, {
    title: req.body.title !== undefined ? String(req.body.title).trim() : conv.title,
    mode: req.body.mode || conv.mode,
    subject: req.body.subject !== undefined ? req.body.subject : conv.subject,
    topic: req.body.topic !== undefined ? req.body.topic : conv.topic,
  });
  res.json({ success: true, conversation: updated });
});

export const deleteConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const conv = await db.conversations.findById(req.params.id);
  if (!conv || String(conv.user) !== req.user!._id) {
    throw new AppError('Conversation not found.', 404);
  }
  await db.conversations.deleteById(req.params.id);
  await db.messages.deleteMany({ conversation: String(conv._id) });
  res.json({ success: true, message: 'Conversation deleted.' });
});

export const clearConversationMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const conv = await db.conversations.findById(req.params.id);
  if (!conv || String(conv.user) !== req.user!._id) {
    throw new AppError('Conversation not found.', 404);
  }
  await db.messages.deleteMany({ conversation: String(conv._id) });
  res.json({ success: true, message: 'Conversation messages cleared.' });
});

export const sendTutorMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const conv = await db.conversations.findById(req.params.id);
  if (!conv || String(conv.user) !== req.user!._id) {
    throw new AppError('Conversation not found.', 404);
  }

  const { content, mode } = req.body;
  if (!content || !String(content).trim()) {
    throw new AppError('Message content cannot be empty.', 400);
  }

  const activeMode = mode || conv.mode || 'Intermediate';
  if (mode && mode !== conv.mode) {
    await db.conversations.updateById(String(conv._id), { mode: activeMode });
  }

  const existingMessages = await db.messages.find({ conversation: String(conv._id) }, { sort: { createdAt: 1 } });

  const userMsg = await db.messages.create({
    conversation: String(conv._id),
    role: 'user',
    content: String(content).trim(),
  });

  const aiReplyText = await generateTutorResponse({
    mode: activeMode,
    subject: conv.subject,
    topic: conv.topic,
    history: existingMessages.map((m) => ({ role: m.role, content: m.content })),
    userMessage: String(content).trim(),
  });

  const assistantMsg = await db.messages.create({
    conversation: String(conv._id),
    role: 'assistant',
    content: aiReplyText,
  });

  // Auto-rename generic conversation title on first message
  const nextTitle =
    conv.title === 'New AI Tutor Session' && existingMessages.length === 0
      ? String(content).trim().slice(0, 52)
      : conv.title;

  const updatedConv = await db.conversations.updateById(String(conv._id), {
    title: nextTitle,
    mode: activeMode,
  });

  await db.activities.create({
    user: req.user!._id,
    activityType: 'tutor_session',
    title: `AI Tutor (${activeMode}): ${nextTitle}`,
    subject: conv.subject || 'General',
    topic: conv.topic || '',
    referenceId: String(conv._id),
  });

  res.status(201).json({
    success: true,
    conversation: updatedConv,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
  });
});

// 2. AI NOTES CONTROLLERS
export const getNotes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, difficulty, search } = req.query;
  let notes = await db.notes.find({ user: req.user!._id }, { sort: { createdAt: -1 } });
  if (subject && subject !== 'All') {
    notes = notes.filter((n) => n.subject === subject);
  }
  if (difficulty && difficulty !== 'All') {
    notes = notes.filter((n) => n.difficulty === difficulty);
  }
  if (search) {
    const q = String(search).toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.topic.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, notes });
});

export const getNoteById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const note = await db.notes.findById(req.params.id);
  if (!note || String(note.user) !== req.user!._id) {
    throw new AppError('Note not found.', 404);
  }
  res.json({ success: true, note });
});

export const generateNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, topic, difficulty, length, title } = req.body;
  if (!subject || !topic) {
    throw new AppError('Subject and topic are required to generate study notes.', 400);
  }

  const generated = await generateStructuredNotes({
    subject: String(subject).trim(),
    topic: String(topic).trim(),
    difficulty: difficulty || 'Intermediate',
    length: length || 'Standard',
  });

  const note = await db.notes.create({
    user: req.user!._id,
    subject: String(subject).trim(),
    topic: String(topic).trim(),
    title: title ? String(title).trim() : `${topic} — ${difficulty || 'Intermediate'} Study Notes`,
    content: generated.content,
    structuredSections: generated.structuredSections,
    difficulty: difficulty || 'Intermediate',
    length: length || 'Standard',
  });

  await db.activities.create({
    user: req.user!._id,
    activityType: 'note_generated',
    title: `Generated AI Notes: ${note.title}`,
    subject: note.subject,
    topic: note.topic,
    referenceId: String(note._id),
  });

  res.status(201).json({ success: true, note });
});

export const updateNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.notes.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Note not found.', 404);
  }
  const updated = await db.notes.updateById(req.params.id, {
    title: req.body.title !== undefined ? String(req.body.title).trim() : existing.title,
    content: req.body.content !== undefined ? req.body.content : existing.content,
    difficulty: req.body.difficulty || existing.difficulty,
  });
  res.json({ success: true, note: updated });
});

export const deleteNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.notes.findById(req.params.id);
  if (!existing || String(existing.user) !== req.user!._id) {
    throw new AppError('Note not found.', 404);
  }
  await db.notes.deleteById(req.params.id);
  res.json({ success: true, message: 'Study note deleted.' });
});

// 3. AI QUIZ CONTROLLERS
export const getQuizzes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const quizzes = await db.quizzes.find({ user: req.user!._id }, { sort: { createdAt: -1 } });
  const attempts = await db.quizAttempts.find({ user: req.user!._id }, { sort: { completedAt: -1 } });

  const safeQuizzes = quizzes.map((q) => {
    const qAttempts = attempts.filter((a) => String(a.quiz) === String(q._id));
    const bestScore =
      qAttempts.length > 0 ? Math.max(...qAttempts.map((a) => Number(a.percentage || 0))) : null;
    return {
      _id: q._id,
      title: q.title,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      questionType: q.questionType,
      questionCount: q.questions?.length || 0,
      timeLimitMinutes: q.timeLimitMinutes || 15,
      attemptCount: qAttempts.length,
      bestScore,
      latestAttemptId: qAttempts[0]?._id || null,
      createdAt: q.createdAt,
    };
  });

  res.json({ success: true, quizzes: safeQuizzes, recentAttempts: attempts.slice(0, 10) });
});

export const generateQuiz = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject, topic, difficulty, questionCount, questionType, title } = req.body;
  if (!subject || !topic) {
    throw new AppError('Subject and topic are required to generate a quiz.', 400);
  }

  const count = Math.min(Math.max(Number(questionCount) || 5, 3), 15);
  const questions = await generateQuizQuestions({
    subject: String(subject).trim(),
    topic: String(topic).trim(),
    difficulty: difficulty || 'Intermediate',
    questionCount: count,
    questionType: questionType || 'MCQ',
  });

  const quiz = await db.quizzes.create({
    user: req.user!._id,
    subject: String(subject).trim(),
    topic: String(topic).trim(),
    title: title ? String(title).trim() : `${topic} (${difficulty || 'Intermediate'} Quiz)`,
    difficulty: difficulty || 'Intermediate',
    questionType: questionType || 'MCQ',
    timeLimitMinutes: Math.max(5, count * 2),
    questions,
  });

  // Never expose correctAnswer or explanation before submission!
  const sanitizedQuestions = quiz.questions.map((q: any) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options,
  }));

  res.status(201).json({
    success: true,
    quiz: {
      ...quiz,
      questions: sanitizedQuestions,
    },
  });
});

export const getQuizForTaking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const quiz = await db.quizzes.findById(req.params.id);
  if (!quiz || String(quiz.user) !== req.user!._id) {
    throw new AppError('Quiz not found.', 404);
  }

  // SECURITY RULE: Strip correctAnswer and explanation before sending to browser
  const sanitizedQuestions = (quiz.questions || []).map((q: any) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options,
  }));

  res.json({
    success: true,
    quiz: {
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questionType: quiz.questionType,
      timeLimitMinutes: quiz.timeLimitMinutes || 10,
      questions: sanitizedQuestions,
      createdAt: quiz.createdAt,
    },
  });
});

export const submitQuizAttempt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const quiz = await db.quizzes.findById(req.params.id);
  if (!quiz || String(quiz.user) !== req.user!._id) {
    throw new AppError('Quiz not found.', 404);
  }

  const { answers, timeSpentSeconds } = req.body;
  const userAnswersMap = new Map<string, string>();
  if (Array.isArray(answers)) {
    for (const a of answers) {
      if (a && a.questionId) {
        userAnswersMap.set(String(a.questionId), String(a.userAnswer || '').trim());
      }
    }
  } else if (answers && typeof answers === 'object') {
    for (const [qId, ans] of Object.entries(answers)) {
      userAnswersMap.set(String(qId), String(ans || '').trim());
    }
  }

  let correctCount = 0;
  let incorrectCount = 0;
  const gradedAnswers = (quiz.questions || []).map((q: any) => {
    const submitted = userAnswersMap.get(String(q.id)) || '';
    const expected = String(q.correctAnswer || '').trim();

    let isCorrect = false;
    if (q.type === 'Short Answer') {
      isCorrect =
        submitted.toLowerCase() === expected.toLowerCase() ||
        (submitted.length >= 3 && expected.toLowerCase().includes(submitted.toLowerCase())) ||
        (expected.length >= 3 && submitted.toLowerCase().includes(expected.toLowerCase()));
    } else {
      isCorrect = submitted.toLowerCase() === expected.toLowerCase();
    }

    if (isCorrect) correctCount++;
    else incorrectCount++;

    return {
      questionId: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      userAnswer: submitted || '(No Answer Submitted)',
      isCorrect,
      correctAnswer: expected,
      explanation: q.explanation,
    };
  });

  const totalQuestions = Math.max(1, (quiz.questions || []).length);
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const analysis =
    percentage >= 85
      ? `Strong mastery demonstrated in ${quiz.topic} (${percentage}%). Ready to advance to higher-complexity problems.`
      : percentage >= 65
      ? `Solid foundational grasp of ${quiz.topic} (${percentage}%), with ${incorrectCount} concept(s) requiring targeted revision.`
      : `Attention Needed: Score of ${percentage}% in ${quiz.topic} indicates conceptual gaps. Review the step-by-step explanations below and practice with the AI Tutor.`;

  const attempt = await db.quizAttempts.create({
    user: req.user!._id,
    quiz: String(quiz._id),
    subject: quiz.subject,
    topic: quiz.topic,
    answers: gradedAnswers,
    score: correctCount,
    totalQuestions,
    percentage,
    timeSpentSeconds: Number(timeSpentSeconds) || 60,
    performanceAnalysis: analysis,
    completedAt: new Date().toISOString(),
  });

  // Update Progress Record for this Topic
  const existingProg = await db.progress.findOne({ user: req.user!._id, topic: quiz.topic });
  if (existingProg) {
    const prevAttempts = Number(existingProg.quizAttempts || 0);
    const prevAvg = Number(existingProg.averageScore || 0);
    const newAttempts = prevAttempts + 1;
    const newAvg = Math.round((prevAvg * prevAttempts + percentage) / newAttempts);
    await db.progress.updateById(String(existingProg._id), {
      quizAttempts: newAttempts,
      averageScore: newAvg,
      incorrectCount: Number(existingProg.incorrectCount || 0) + incorrectCount,
      completionPercentage: Math.min(100, Math.max(Number(existingProg.completionPercentage || 0), percentage >= 70 ? 85 : 45)),
      studyTime: Number(existingProg.studyTime || 0) + Math.max(5, Math.round((Number(timeSpentSeconds) || 120) / 60)),
      lastStudiedAt: new Date().toISOString(),
    });
  } else {
    await db.progress.create({
      user: req.user!._id,
      subject: quiz.subject,
      topic: quiz.topic,
      completionPercentage: percentage >= 70 ? 80 : 35,
      studyTime: Math.max(10, Math.round((Number(timeSpentSeconds) || 180) / 60)),
      tasksCompleted: 1,
      tasksTotal: 3,
      quizAttempts: 1,
      averageScore: percentage,
      incorrectCount,
      lastStudiedAt: new Date().toISOString(),
    });
  }

  await db.activities.create({
    user: req.user!._id,
    activityType: 'quiz_completed',
    title: `Completed Quiz: ${quiz.title} (Score: ${percentage}%)`,
    subject: quiz.subject,
    topic: quiz.topic,
    referenceId: String(attempt._id),
    metadata: { score: correctCount, totalQuestions, percentage },
  });

  res.status(201).json({
    success: true,
    attempt,
    quizTitle: quiz.title,
  });
});

export const getQuizResult = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { attemptId } = req.query;

  const quiz = await db.quizzes.findById(id);
  if (!quiz || String(quiz.user) !== req.user!._id) {
    throw new AppError('Quiz not found.', 404);
  }

  let attempt = null;
  if (attemptId) {
    attempt = await db.quizAttempts.findById(String(attemptId));
  }
  if (!attempt) {
    const attempts = await db.quizAttempts.find(
      { user: req.user!._id, quiz: String(quiz._id) },
      { sort: { completedAt: -1 } }
    );
    attempt = attempts[0] || null;
  }

  if (!attempt || String(attempt.user) !== req.user!._id) {
    throw new AppError('No completed attempt found for this quiz yet.', 404);
  }

  // Enrich attempt answers with original question text if needed
  const questionMap = new Map<string, any>((quiz.questions || []).map((q: any) => [String(q.id), q]));
  const enrichedAnswers = (attempt.answers || []).map((ans: any) => {
    const q = questionMap.get(String(ans.questionId));
    return {
      ...ans,
      question: ans.question || q?.question || '',
      options: ans.options || q?.options || [],
      type: ans.type || q?.type || 'MCQ',
    };
  });

  res.json({
    success: true,
    quiz: {
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
    },
    attempt: {
      ...attempt,
      answers: enrichedAnswers,
    },
  });
});

// 4. DOCUMENT UPLOAD & RAG Q&A CONTROLLERS
export const getDocuments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const docs = await db.documents.find({ user: req.user!._id }, { sort: { createdAt: -1 } });
  const list = docs.map(({ extractedText, filePath, ...rest }) => ({
    ...rest,
    previewSnippet: (extractedText || '').slice(0, 220),
  }));
  res.json({ success: true, documents: list });
});

export const getDocumentById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const doc = await db.documents.findById(req.params.id);
  if (!doc || String(doc.user) !== req.user!._id) {
    throw new AppError('Document not found.', 404);
  }
  const chunks = await db.documentChunks.find(
    { document: String(doc._id), user: req.user!._id },
    { sort: { chunkIndex: 1 } }
  );
  const { filePath, ...safeDoc } = doc;
  res.json({
    success: true,
    document: safeDoc,
    chunks: chunks.map((c) => ({
      _id: c._id,
      pageNumber: c.pageNumber,
      chunkIndex: c.chunkIndex,
      content: c.content,
    })),
  });
});

export const uploadDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const file = (req as any).file;
  const { subject, customText, title } = req.body;

  if (!file && !customText) {
    throw new AppError('Please select a valid PDF, DOCX, or TXT file to upload.', 400);
  }

  let originalName = file ? file.originalname : `${title || 'Study_Material'}.txt`;
  let fileName = file ? file.filename : `note-${Date.now()}.txt`;
  let filePath = file ? file.path : '';
  let fileType = file ? file.mimetype : 'text/plain';
  let fileSize = file ? file.size : Buffer.byteLength(String(customText || ''), 'utf-8');

  let extracted = {
    extractedText: '',
    pageCount: 1,
    pages: [{ pageNumber: 1, text: '' }],
  };

  if (file) {
    extracted = await extractDocumentText(file.path, file.mimetype, file.originalname);
  } else {
    const clean = String(customText || '').trim();
    extracted = {
      extractedText: clean,
      pageCount: Math.max(1, Math.ceil(clean.length / 1800)),
      pages: [{ pageNumber: 1, text: clean }],
    };
  }

  const doc = await db.documents.create({
    user: req.user!._id,
    subject: subject || 'General',
    originalName,
    fileName,
    filePath,
    fileType,
    fileSize,
    status: 'ready',
    extractedText: extracted.extractedText,
    pageCount: extracted.pageCount,
    chunkCount: 0,
    summary: extracted.extractedText.slice(0, 300) + (extracted.extractedText.length > 300 ? '...' : ''),
  });

  const chunkCount = await processDocumentIntoChunks({
    documentId: String(doc._id),
    userId: req.user!._id,
    documentName: originalName,
    pages: extracted.pages,
  });

  const updatedDoc = await db.documents.updateById(String(doc._id), { chunkCount });
  const { filePath: _fp, extractedText: _et, ...safeUpdatedDoc } = updatedDoc || doc;

  await db.activities.create({
    user: req.user!._id,
    activityType: 'document_uploaded',
    title: `Uploaded & Indexed Document: ${originalName} (${chunkCount} RAG chunks)`,
    subject: subject || 'General',
    referenceId: String(doc._id),
  });

  res.status(201).json({
    success: true,
    document: safeUpdatedDoc,
  });
});

export const deleteDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const doc = await db.documents.findById(req.params.id);
  if (!doc || String(doc.user) !== req.user!._id) {
    throw new AppError('Document not found.', 404);
  }
  await db.documents.deleteById(req.params.id);
  await db.documentChunks.deleteMany({ document: String(doc._id) });
  res.json({ success: true, message: 'Document and vector embeddings deleted.' });
});

export const askDocumentQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { documentId, question } = req.body;
  if (!question || !String(question).trim()) {
    throw new AppError('Please provide a question to ask against your document(s).', 400);
  }

  if (documentId && documentId !== 'all') {
    const doc = await db.documents.findById(String(documentId));
    if (!doc || String(doc.user) !== req.user!._id) {
      throw new AppError('Authorized document not found.', 404);
    }
  }

  const ragResult = await answerQuestionWithRAG({
    userId: req.user!._id,
    documentId: documentId ? String(documentId) : 'all',
    question: String(question).trim(),
  });

  res.json({
    success: true,
    ...ragResult,
  });
});
