import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
const LandingPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.ForgotPasswordPage })));

// Student Pages
const DashboardPage = lazy(() => import('./pages/CoreStudentPages').then((m) => ({ default: m.DashboardPage })));
const SubjectsPage = lazy(() => import('./pages/CoreStudentPages').then((m) => ({ default: m.SubjectsPage })));
const SubjectDetailPage = lazy(() => import('./pages/CoreStudentPages').then((m) => ({ default: m.SubjectDetailPage })));
const TopicDetailPage = lazy(() => import('./pages/CoreStudentPages').then((m) => ({ default: m.TopicDetailPage })));
const ProfilePage = lazy(() => import('./pages/CoreStudentPages').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/CoreStudentPages').then((m) => ({ default: m.SettingsPage })));

const AITutorPage = lazy(() => import('./pages/AITutorAndNotesPages').then((m) => ({ default: m.AITutorPage })));
const NotesPage = lazy(() => import('./pages/AITutorAndNotesPages').then((m) => ({ default: m.NotesPage })));
const NoteDetailPage = lazy(() => import('./pages/AITutorAndNotesPages').then((m) => ({ default: m.NoteDetailPage })));

const QuizzesPage = lazy(() => import('./pages/QuizAndDocumentPages').then((m) => ({ default: m.QuizzesPage })));
const QuizCreatePage = lazy(() => import('./pages/QuizAndDocumentPages').then((m) => ({ default: m.QuizCreatePage })));
const QuizTakePage = lazy(() => import('./pages/QuizAndDocumentPages').then((m) => ({ default: m.QuizTakePage })));
const QuizResultPage = lazy(() => import('./pages/QuizAndDocumentPages').then((m) => ({ default: m.QuizResultPage })));
const DocumentsPage = lazy(() => import('./pages/QuizAndDocumentPages').then((m) => ({ default: m.DocumentsPage })));
const DocumentDetailPage = lazy(() => import('./pages/QuizAndDocumentPages').then((m) => ({ default: m.DocumentDetailPage })));

const FlashcardsPage = lazy(() => import('./pages/FlashcardPages').then((m) => ({ default: m.FlashcardsPage })));
const DeckDetailPage = lazy(() => import('./pages/FlashcardPages').then((m) => ({ default: m.DeckDetailPage })));
const FlashcardStudyPage = lazy(() => import('./pages/FlashcardPages').then((m) => ({ default: m.FlashcardStudyPage })));

const StudyPlansPage = lazy(() => import('./pages/PlannerAndAnalyticsPages').then((m) => ({ default: m.StudyPlansPage })));
const StudyPlanDetailPage = lazy(() => import('./pages/PlannerAndAnalyticsPages').then((m) => ({ default: m.StudyPlanDetailPage })));
const TasksPage = lazy(() => import('./pages/PlannerAndAnalyticsPages').then((m) => ({ default: m.TasksPage })));
const ProgressPage = lazy(() => import('./pages/PlannerAndAnalyticsPages').then((m) => ({ default: m.ProgressPage })));
const RecommendationsPage = lazy(() => import('./pages/PlannerAndAnalyticsPages').then((m) => ({ default: m.RecommendationsPage })));
const HistoryPage = lazy(() => import('./pages/PlannerAndAnalyticsPages').then((m) => ({ default: m.HistoryPage })));
const SearchPage = lazy(() => import('./pages/PlannerAndAnalyticsPages').then((m) => ({ default: m.SearchPage })));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminUsersPage })));
const AdminSubjectsPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminSubjectsPage })));
const AdminTopicsPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminTopicsPage })));
const AdminDocumentsPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminDocumentsPage })));

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
  </div>
);

const ProtectedWorkspace: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => (
  <ProtectedRoute requireAdmin={requireAdmin}>
    <DashboardLayout>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </DashboardLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Student Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedWorkspace>
                  <DashboardPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedWorkspace>
                  <ProfilePage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedWorkspace>
                  <SettingsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedWorkspace>
                  <SubjectsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/subjects/:id"
              element={
                <ProtectedWorkspace>
                  <SubjectDetailPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/topics/:id"
              element={
                <ProtectedWorkspace>
                  <TopicDetailPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/ai-tutor"
              element={
                <ProtectedWorkspace>
                  <AITutorPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/ai-tutor/:conversationId"
              element={
                <ProtectedWorkspace>
                  <AITutorPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedWorkspace>
                  <NotesPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/notes/:id"
              element={
                <ProtectedWorkspace>
                  <NoteDetailPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedWorkspace>
                  <QuizzesPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/quiz/create"
              element={
                <ProtectedWorkspace>
                  <QuizCreatePage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <ProtectedWorkspace>
                  <QuizTakePage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/quiz/:id/result"
              element={
                <ProtectedWorkspace>
                  <QuizResultPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedWorkspace>
                  <DocumentsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/documents/:id"
              element={
                <ProtectedWorkspace>
                  <DocumentDetailPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/flashcards"
              element={
                <ProtectedWorkspace>
                  <FlashcardsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/flashcards/:id"
              element={
                <ProtectedWorkspace>
                  <DeckDetailPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/flashcards/:id/study"
              element={
                <ProtectedWorkspace>
                  <FlashcardStudyPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/study-plans"
              element={
                <ProtectedWorkspace>
                  <StudyPlansPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/study-plans/:id"
              element={
                <ProtectedWorkspace>
                  <StudyPlanDetailPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedWorkspace>
                  <TasksPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedWorkspace>
                  <ProgressPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedWorkspace>
                  <RecommendationsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedWorkspace>
                  <HistoryPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedWorkspace>
                  <SearchPage />
                </ProtectedWorkspace>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedWorkspace requireAdmin>
                  <AdminDashboardPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedWorkspace requireAdmin>
                  <AdminUsersPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedWorkspace requireAdmin>
                  <AdminSubjectsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/admin/topics"
              element={
                <ProtectedWorkspace requireAdmin>
                  <AdminTopicsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedWorkspace requireAdmin>
                  <AdminDocumentsPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedWorkspace requireAdmin>
                  <AdminDashboardPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedWorkspace requireAdmin>
                  <HistoryPage />
                </ProtectedWorkspace>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedWorkspace requireAdmin>
                  <SettingsPage />
                </ProtectedWorkspace>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
