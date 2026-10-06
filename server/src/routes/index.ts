import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middleware/auth.ts';
import { uploadMiddleware } from '../middleware/upload.ts';
import { env } from '../config/env.ts';
import * as authCtrl from '../controllers/authController.ts';
import * as curriculumCtrl from '../controllers/curriculumController.ts';
import * as plannerCtrl from '../controllers/plannerController.ts';
import * as aiCtrl from '../controllers/aiWorkspaceController.ts';
import * as analyticsCtrl from '../controllers/analyticsAndAdminController.ts';
import * as flashcardCtrl from '../controllers/flashcardController.ts';

const router = Router();

// Health check (safe production metadata only — no secrets, URIs, or internal paths)
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    success: true,
  });
});

// 1. AUTH
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', authenticate, authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.getMe);

// 2. USERS
router.get('/users/me', authenticate, authCtrl.getMe);
router.put('/users/me', authenticate, authCtrl.updateProfile);
router.put('/users/me/password', authenticate, authCtrl.updatePassword);

// 3. SUBJECTS
router.get('/subjects', curriculumCtrl.getSubjects);
router.get('/subjects/:id', curriculumCtrl.getSubjectById);
router.get('/subjects/:subjectId/topics', curriculumCtrl.getTopicsBySubject);
router.post('/subjects', authenticate, authorizeAdmin, curriculumCtrl.createSubject);
router.put('/subjects/:id', authenticate, authorizeAdmin, curriculumCtrl.updateSubject);
router.delete('/subjects/:id', authenticate, authorizeAdmin, curriculumCtrl.deleteSubject);

// 4. TOPICS
router.get('/topics', curriculumCtrl.getTopics);
router.get('/topics/:id', authenticate, curriculumCtrl.getTopicById);
router.post('/topics', authenticate, authorizeAdmin, curriculumCtrl.createTopic);
router.put('/topics/:id', authenticate, authorizeAdmin, curriculumCtrl.updateTopic);
router.delete('/topics/:id', authenticate, authorizeAdmin, curriculumCtrl.deleteTopic);

// 5. GOALS
router.get('/goals', authenticate, plannerCtrl.getGoals);
router.post('/goals', authenticate, plannerCtrl.createGoal);
router.get('/goals/:id', authenticate, plannerCtrl.getGoalById);
router.put('/goals/:id', authenticate, plannerCtrl.updateGoal);
router.delete('/goals/:id', authenticate, plannerCtrl.deleteGoal);

// 6. STUDY PLANS
router.get('/study-plans', authenticate, plannerCtrl.getStudyPlans);
router.post('/study-plans', authenticate, plannerCtrl.createStudyPlan);
router.get('/study-plans/:id', authenticate, plannerCtrl.getStudyPlanById);
router.put('/study-plans/:id', authenticate, plannerCtrl.updateStudyPlan);
router.delete('/study-plans/:id', authenticate, plannerCtrl.deleteStudyPlan);

// 7. STUDY TASKS
router.get('/study-tasks', authenticate, plannerCtrl.getStudyTasks);
router.post('/study-tasks', authenticate, plannerCtrl.createStudyTask);
router.get('/study-tasks/:id', authenticate, plannerCtrl.getStudyTaskById);
router.put('/study-tasks/:id', authenticate, plannerCtrl.updateStudyTask);
router.patch('/study-tasks/:id/status', authenticate, plannerCtrl.updateStudyTaskStatus);
router.delete('/study-tasks/:id', authenticate, plannerCtrl.deleteStudyTask);

// 8. PROGRESS
router.get('/progress', authenticate, analyticsCtrl.getProgressOverview);
router.post('/progress/mark-topic', authenticate, analyticsCtrl.markTopicStudied);
router.get('/progress/subjects', authenticate, analyticsCtrl.getSubjectProgressList);
router.get('/progress/topics', authenticate, analyticsCtrl.getTopicProgressList);
router.get('/progress/:subjectId', authenticate, analyticsCtrl.getProgressBySubject);

// 9. STUDY SESSIONS
router.get('/study-sessions', authenticate, analyticsCtrl.getStudySessions);
router.post('/study-sessions', authenticate, analyticsCtrl.createStudySession);
router.get('/study-sessions/summary', authenticate, analyticsCtrl.getStudySessionsSummary);

// 10. ACTIVITIES & HISTORY
router.get('/activities', authenticate, analyticsCtrl.getActivities);
router.get('/activities/recent', authenticate, analyticsCtrl.getRecentActivities);

// 11. DASHBOARD
router.get('/dashboard', authenticate, analyticsCtrl.getStudentDashboard);

// 12. AI TUTOR
router.get('/ai-tutor/conversations', authenticate, aiCtrl.getConversations);
router.post('/ai-tutor/conversations', authenticate, aiCtrl.createConversation);
router.get('/ai-tutor/conversations/:id', authenticate, aiCtrl.getConversationById);
router.put('/ai-tutor/conversations/:id', authenticate, aiCtrl.updateConversation);
router.delete('/ai-tutor/conversations/:id', authenticate, aiCtrl.deleteConversation);
router.delete('/ai-tutor/conversations/:id/messages', authenticate, aiCtrl.clearConversationMessages);
router.post('/ai-tutor/conversations/:id/messages', authenticate, aiCtrl.sendTutorMessage);

// 13. AI NOTES
router.get('/notes', authenticate, aiCtrl.getNotes);
router.post('/notes/generate', authenticate, aiCtrl.generateNote);
router.get('/notes/:id', authenticate, aiCtrl.getNoteById);
router.put('/notes/:id', authenticate, aiCtrl.updateNote);
router.delete('/notes/:id', authenticate, aiCtrl.deleteNote);

// 14. AI QUIZZES
router.get('/quizzes', authenticate, aiCtrl.getQuizzes);
router.post('/quizzes/generate', authenticate, aiCtrl.generateQuiz);
router.get('/quizzes/:id', authenticate, aiCtrl.getQuizForTaking);
router.post('/quizzes/:id/submit', authenticate, aiCtrl.submitQuizAttempt);
router.get('/quizzes/:id/result', authenticate, aiCtrl.getQuizResult);

// 15. DOCUMENTS & RAG Q&A
router.get('/documents', authenticate, aiCtrl.getDocuments);
router.post('/documents/upload', authenticate, uploadMiddleware.single('file'), aiCtrl.uploadDocument);
router.post('/documents/ask', authenticate, aiCtrl.askDocumentQuestion);
router.get('/documents/:id', authenticate, aiCtrl.getDocumentById);
router.delete('/documents/:id', authenticate, aiCtrl.deleteDocument);

// 16. RECOMMENDATIONS
router.get('/recommendations', authenticate, analyticsCtrl.getRecommendations);
router.post('/recommendations/refresh', authenticate, analyticsCtrl.refreshRecommendations);
router.patch('/recommendations/:id/status', authenticate, analyticsCtrl.updateRecommendationStatus);

// 17. FLASHCARDS & SPACED REPETITION
router.get('/flashcards/decks', authenticate, flashcardCtrl.getDecks);
router.post('/flashcards/decks', authenticate, flashcardCtrl.createDeck);
router.get('/flashcards/decks/:id', authenticate, flashcardCtrl.getDeckById);
router.put('/flashcards/decks/:id', authenticate, flashcardCtrl.updateDeck);
router.delete('/flashcards/decks/:id', authenticate, flashcardCtrl.deleteDeck);

router.post('/flashcards/decks/:id/cards', authenticate, flashcardCtrl.addCard);
router.get('/flashcards/decks/:id/cards', authenticate, flashcardCtrl.getDeckCards);
router.put('/flashcards/cards/:id', authenticate, flashcardCtrl.updateCard);
router.delete('/flashcards/cards/:id', authenticate, flashcardCtrl.deleteCard);

router.post('/flashcards/decks/:id/review', authenticate, flashcardCtrl.reviewCard);
router.post('/flashcards/decks/:id/reset', authenticate, flashcardCtrl.resetDeckProgress);
router.post('/flashcards/generate', authenticate, flashcardCtrl.generateFlashcards);
router.get('/flashcards/review/today', authenticate, flashcardCtrl.getReviewToday);
router.get('/flashcards/summary', authenticate, flashcardCtrl.getFlashcardSummary);

// 18. GLOBAL SEARCH
router.get('/search', authenticate, analyticsCtrl.globalSearch);

// 19. ADMIN DASHBOARD (Protected by Role-Based Authorization)
router.get('/admin/overview', authenticate, authorizeAdmin, analyticsCtrl.getAdminOverview);
router.get('/admin/users', authenticate, authorizeAdmin, analyticsCtrl.getAdminUsers);
router.patch('/admin/users/:id/status', authenticate, authorizeAdmin, analyticsCtrl.toggleAdminUserStatus);
router.get('/admin/users/:id/activity', authenticate, authorizeAdmin, analyticsCtrl.getAdminUserActivity);
router.get('/admin/documents', authenticate, authorizeAdmin, analyticsCtrl.getAdminDocuments);
router.delete('/admin/documents/:id', authenticate, authorizeAdmin, analyticsCtrl.deleteAdminDocument);

export default router;
