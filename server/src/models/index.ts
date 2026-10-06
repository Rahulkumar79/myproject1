import mongoose, { Schema } from 'mongoose';

// 1. USER MODEL
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, default: '' },
    educationLevel: { type: String, default: 'Undergraduate' },
    college: { type: String, default: '' },
    subjects: [{ type: String }],
    learningGoals: [{ type: String }],
    preferredStudyHours: { type: Number, default: 3 },
    streakDays: { type: Number, default: 1 },
    lastStudyDate: { type: String, default: '' },
    passwordChangedAt: { type: String, default: '' },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 2. SUBJECT MODEL
const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
    icon: { type: String, default: 'BookOpen' },
  },
  { timestamps: true }
);

// 3. TOPIC MODEL
const topicSchema = new Schema(
  {
    subject: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
    estimatedStudyTime: { type: Number, default: 45 }, // minutes
    prerequisites: [{ type: String }],
    keyConcepts: [{ type: String }],
    contentSummary: { type: String, default: '' },
  },
  { timestamps: true }
);

// 4. LEARNING GOAL MODEL
const learningGoalSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    targetDate: { type: String, required: true },
    targetType: { type: String, enum: ['hours', 'topics', 'quizzes', 'score'], default: 'hours' },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'overdue'], default: 'active' },
  },
  { timestamps: true }
);

// 5. STUDY PLAN MODEL
const studyPlanSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    examDate: { type: String, default: '' },
    dailyHours: { type: Number, default: 3 },
    knowledgeLevel: { type: String, default: 'Intermediate' },
    targetScore: { type: Number, default: 85 },
    subjects: [{ type: String }],
    weakSubjects: [{ type: String }],
    preferredStudyTime: { type: String, default: 'Morning' },
    goals: [{ type: String }],
    weeklySummary: [{ type: Schema.Types.Mixed }],
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

// 6. STUDY TASK MODEL
const studyTaskSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    studyPlan: { type: String, default: '', index: true },
    subject: { type: String, default: '' },
    topic: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    taskType: { type: String, enum: ['study', 'revision', 'practice', 'quiz'], default: 'study' },
    scheduledDate: { type: String, required: true, index: true },
    estimatedDuration: { type: Number, default: 45 }, // minutes
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending', index: true },
    completedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

// 7. PROGRESS MODEL
const progressSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    completionPercentage: { type: Number, default: 0 },
    studyTime: { type: Number, default: 0 }, // minutes
    tasksCompleted: { type: Number, default: 0 },
    tasksTotal: { type: Number, default: 1 },
    quizAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    lastStudiedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

// 8. STUDY SESSION MODEL
const studySessionSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    topic: { type: String, default: '' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true }, // minutes
    activityType: { type: String, enum: ['reading', 'ai-tutor', 'quiz', 'notes', 'document-review', 'practice', 'flashcards'], default: 'reading' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// 9. LEARNING ACTIVITY MODEL
const learningActivitySchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    activityType: {
      type: String,
      enum: [
        'tutor_session',
        'note_generated',
        'quiz_completed',
        'document_uploaded',
        'study_session',
        'task_completed',
        'plan_created',
        'topic_completed',
        'flashcard_deck_created',
        'flashcard_reviewed',
      ],
      required: true,
    },
    title: { type: String, default: '' },
    subject: { type: String, default: '' },
    topic: { type: String, default: '' },
    referenceId: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// 10. AI CONVERSATION MODEL
const aiConversationSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    mode: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Interview Preparation', 'Exam Preparation'],
      default: 'Intermediate',
    },
    subject: { type: String, default: '' },
    topic: { type: String, default: '' },
  },
  { timestamps: true }
);

// 11. AI MESSAGE MODEL
const aiMessageSchema = new Schema(
  {
    conversation: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// 12. NOTE MODEL
const noteSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    structuredSections: { type: Schema.Types.Mixed, default: {} },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
    length: { type: String, enum: ['Concise', 'Standard', 'Comprehensive'], default: 'Standard' },
  },
  { timestamps: true }
);

// 13. QUIZ MODEL
const quizSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
    questionType: { type: String, enum: ['MCQ', 'True/False', 'Short Answer', 'Mixed'], default: 'MCQ' },
    timeLimitMinutes: { type: Number, default: 15 },
    questions: [
      {
        id: { type: String, required: true },
        type: { type: String, enum: ['MCQ', 'True/False', 'Short Answer'], default: 'MCQ' },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        explanation: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// 14. QUIZ ATTEMPT MODEL
const quizAttemptSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    quiz: { type: String, required: true, index: true },
    subject: { type: String, default: '' },
    topic: { type: String, default: '' },
    answers: [
      {
        questionId: { type: String, required: true },
        userAnswer: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        correctAnswer: { type: String, default: '' },
        explanation: { type: String, default: '' },
      },
    ],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeSpentSeconds: { type: Number, default: 0 },
    performanceAnalysis: { type: String, default: '' },
    completedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// 15. DOCUMENT MODEL
const documentSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    subject: { type: String, default: '' },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'ready' },
    extractedText: { type: String, default: '' },
    pageCount: { type: Number, default: 1 },
    chunkCount: { type: Number, default: 0 },
    summary: { type: String, default: '' },
  },
  { timestamps: true }
);

// 16. DOCUMENT CHUNK MODEL
const documentChunkSchema = new Schema(
  {
    document: { type: String, required: true, index: true },
    user: { type: String, required: true, index: true },
    content: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    chunkIndex: { type: Number, default: 0 },
    embedding: [{ type: Number }],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// 17. RECOMMENDATION MODEL
const recommendationSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['study_topic', 'review_topic', 'take_quiz', 'read_notes', 'study_document', 'interview_prep', 'review_flashcards'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    reason: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    relatedSubject: { type: String, default: '' },
    relatedTopic: { type: String, default: '' },
    actionUrl: { type: String, default: '/subjects' },
    status: { type: String, enum: ['active', 'completed', 'dismissed'], default: 'active' },
  },
  { timestamps: true }
);

// 18. FLASHCARD DECK MODEL
const flashcardDeckSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: String, required: true, trim: true, index: true },
    topic: { type: String, default: '' },
    sourceType: {
      type: String,
      enum: ['manual', 'ai', 'note', 'document', 'topic'],
      default: 'manual',
    },
    sourceId: { type: String, default: '' },
    cardCount: { type: Number, default: 0 },
    masteredCount: { type: Number, default: 0 },
    dueCount: { type: Number, default: 0 },
    lastStudiedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

// 19. FLASHCARD MODEL
const flashcardSchema = new Schema(
  {
    deck: { type: String, required: true, index: true },
    user: { type: String, required: true, index: true },
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    hint: { type: String, default: '' },
    explanation: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['new', 'learning', 'review', 'mastered'],
      default: 'new',
    },
    reviewCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 }, // in days
    dueAt: { type: String, required: true, index: true },
    lastReviewedAt: { type: String, default: '' },
    sourcePage: { type: Number, default: null },
  },
  { timestamps: true }
);

// Compound indexes for high-frequency ownership + lookup queries
topicSchema.index({ subject: 1, name: 1 });
studyTaskSchema.index({ user: 1, status: 1, scheduledDate: 1 });
progressSchema.index({ user: 1, topic: 1 }, { unique: false });
progressSchema.index({ user: 1, subject: 1 });
studySessionSchema.index({ user: 1, createdAt: -1 });
learningActivitySchema.index({ user: 1, createdAt: -1 });
aiMessageSchema.index({ conversation: 1, createdAt: 1 });
noteSchema.index({ user: 1, subject: 1, createdAt: -1 });
quizAttemptSchema.index({ user: 1, quiz: 1, completedAt: -1 });
documentChunkSchema.index({ user: 1, document: 1, chunkIndex: 1 });
recommendationSchema.index({ user: 1, status: 1 });
flashcardDeckSchema.index({ user: 1, createdAt: -1 });
flashcardDeckSchema.index({ user: 1, subject: 1 });
flashcardSchema.index({ deck: 1, user: 1, dueAt: 1 });
flashcardSchema.index({ user: 1, dueAt: 1 });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const SubjectModel = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
export const TopicModel = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
export const LearningGoalModel = mongoose.models.LearningGoal || mongoose.model('LearningGoal', learningGoalSchema);
export const StudyPlanModel = mongoose.models.StudyPlan || mongoose.model('StudyPlan', studyPlanSchema);
export const StudyTaskModel = mongoose.models.StudyTask || mongoose.model('StudyTask', studyTaskSchema);
export const ProgressModel = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
export const StudySessionModel = mongoose.models.StudySession || mongoose.model('StudySession', studySessionSchema);
export const LearningActivityModel = mongoose.models.LearningActivity || mongoose.model('LearningActivity', learningActivitySchema);
export const AIConversationModel = mongoose.models.AIConversation || mongoose.model('AIConversation', aiConversationSchema);
export const AIMessageModel = mongoose.models.AIMessage || mongoose.model('AIMessage', aiMessageSchema);
export const NoteModel = mongoose.models.Note || mongoose.model('Note', noteSchema);
export const QuizModel = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
export const QuizAttemptModel = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);
export const DocumentModel = mongoose.models.Document || mongoose.model('Document', documentSchema);
export const DocumentChunkModel = mongoose.models.DocumentChunk || mongoose.model('DocumentChunk', documentChunkSchema);
export const RecommendationModel = mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema);
export const FlashcardDeckModel = mongoose.models.FlashcardDeck || mongoose.model('FlashcardDeck', flashcardDeckSchema);
export const FlashcardModel = mongoose.models.Flashcard || mongoose.model('Flashcard', flashcardSchema);
