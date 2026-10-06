import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  FolderKanban,
  FileText,
  Trash2,
  Search,
  BookOpen,
  AlertCircle,
  Check,
} from 'lucide-react';
import { quizzesApi } from '../api/quizzes';
import { documentsApi } from '../api/documents';
import { subjectsApi } from '../api/subjects';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import {
  AnimatedCard,
  SkeletonCard,
  SkeletonPage,
  EmptyState,
  PageTransition,
  getSubjectVisual,
} from '../components/ui/MotionAndStates';

// 1. QUIZZES LIST PAGE
export const QuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizzesApi
      .getAll()
      .then((res) => {
        setQuizzes(res.quizzes || []);
        setAttempts(res.attempts || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const attemptByQuizId: Record<string, any> = {};
  attempts.forEach((a) => {
    if (!attemptByQuizId[a.quiz]) {
      attemptByQuizId[a.quiz] = a;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-slate-900">Adaptive AI Quizzes &amp; Assessments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate MCQ, True/False, and Short Answer assessments with server-side grading and
            concept explanations.
          </p>
        </div>
        <Link
          to="/quiz/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No quizzes generated yet"
          description="Create your first custom AI assessment on any computer science module to benchmark your understanding."
          actionLabel="Generate Quiz"
          onAction={() => (window.location.href = '/quiz/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => {
            const latestAttempt = attemptByQuizId[quiz._id];
            const visual = getSubjectVisual(quiz.subject);
            const Icon = visual.icon;
            return (
              <AnimatedCard
                key={quiz._id}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${visual.accentBg} border ${visual.accentBorder} ${visual.accentText} flex items-center justify-center`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums">
                      <span>{quiz.difficulty}</span>
                      <span> · </span>
                      <span>{quiz.questionCount || quiz.questions?.length || 5} Qs</span>
                    </div>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mb-1">{quiz.title}</h2>
                  <p className="text-xs text-indigo-600 font-medium mb-3">
                    {quiz.subject} · {quiz.topic}
                  </p>

                  {latestAttempt ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono tabular-nums flex items-center justify-between">
                      <span className="text-slate-600">Latest Score:</span>
                      <span
                        className={`font-bold ${
                          latestAttempt.percentage >= 75
                            ? 'text-emerald-600'
                            : latestAttempt.percentage >= 50
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {latestAttempt.percentage}% ({latestAttempt.score}/
                        {latestAttempt.totalQuestions})
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Not attempted yet</p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/quiz/${quiz._id}`}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {latestAttempt ? 'Retake Quiz' : 'Start Quiz'}
                  </Link>
                  {latestAttempt && (
                    <Link
                      to={`/quiz/${quiz._id}/result`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View Analysis →
                    </Link>
                  )}
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 2. QUIZ CREATE PAGE
export const QuizCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [subject, setSubject] = useState(
    searchParams.get('subject') || 'Data Structures & Algorithms'
  );
  const [topic, setTopic] = useState(
    searchParams.get('topic') || 'Trees, Heaps & Graph Algorithms'
  );
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState('Mixed');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    subjectsApi.getAll().then((res) => setSubjects(res.subjects || []));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast('Please enter a topic for your quiz.', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await quizzesApi.generate({
        subject,
        topic: topic.trim(),
        difficulty,
        questionCount,
        questionType,
      });
      showToast('Quiz generated! Ready to begin.', 'success');
      navigate(`/quiz/${res.quiz._id}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to generate quiz.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/quiz" className="text-xs font-medium text-slate-500 hover:text-slate-900">
        ← Back to Quizzes
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display">
              Configure AI Assessment
            </h1>
            <p className="text-xs text-slate-500">
              Select your subject, topic, question format, and difficulty level.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Specific Topic</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Dijkstra's Algorithm, Process Synchronization, SQL Joins"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              >
                <option value="Mixed">Mixed Formats</option>
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="True/False">True / False</option>
                <option value="Short Answer">Short Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Number of Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full py-3 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50"
          >
            {generating ? 'Generating Assessment Questions...' : 'Generate & Start Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 3. QUIZ TAKE PAGE (Polished Assessment Interface — Zero Answer Leaks Before Submission)
export const QuizTakePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    quizzesApi.getForTaking(id).then((res) => {
      setQuiz(res.quiz);
    });
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!quiz) {
    return <SkeletonPage />;
  }

  const questions = quiz.questions || [];
  const currentQ = questions[activeIdx];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const progressPct =
    questions.length > 0 ? Math.round(((activeIdx + 1) / questions.length) * 100) : 0;

  const handleSelectOption = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmitQuiz = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await quizzesApi.submitAttempt(id, {
        answers,
        timeSpentSeconds: elapsedSeconds,
      });
      showToast('Quiz submitted and graded!', 'success');
      navigate(`/quiz/${id}/result`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to submit quiz.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Assessment Header: Title, Animated Progress Bar & Timer */}
      <div className="bg-slate-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-indigo-400 font-medium">
              {quiz.subject} · {quiz.difficulty}
            </p>
            <h1 className="text-lg font-bold mt-0.5 text-white">{quiz.title}</h1>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
            <div className="flex items-center gap-1.5 text-amber-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-4 h-4" />
              <span>
                {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                {String(elapsedSeconds % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="text-slate-300">
              {answeredCount}/{questions.length} Answered
            </div>
          </div>
        </div>

        {/* Animated Progress Indicator */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums mb-1.5">
            <span>
              Question {activeIdx + 1} of {questions.length}
            </span>
            <span>{progressPct}% Progress</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Number Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {questions.map((q: any, idx: number) => {
          const isAnswered = Boolean(answers[q.id]?.trim());
          const isCurrent = idx === activeIdx;
          return (
            <button
              key={q.id}
              onClick={() => setActiveIdx(idx)}
              aria-label={`Go to question ${idx + 1}`}
              className={`w-9 h-9 rounded-xl text-xs font-mono font-semibold transition-all tabular-nums ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-sm scale-105'
                  : isAnswered
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Center: Question Card with Smooth Question Transition */}
      {currentQ && (
        <PageTransition key={currentQ.id}>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono font-semibold text-indigo-600 tabular-nums">
                Question {activeIdx + 1} of {questions.length}
              </span>
              <span>{currentQ.type}</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h2>

            {currentQ.type === 'Short Answer' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Your Concise Answer
                </label>
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Type your short answer here..."
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {(currentQ.options || []).map((opt: string, optIdx: number) => {
                  const selected = answers[currentQ.id] === opt;
                  const optionLetter = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-xs transition-all duration-150 flex items-center justify-between gap-3 ${
                        selected
                          ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 font-semibold shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/90 text-slate-700 hover:bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg font-mono text-[11px] flex items-center justify-center shrink-0 transition-colors ${
                            selected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'bg-white border border-slate-200 text-slate-500'
                          }`}
                        >
                          {optionLetter}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </div>
                      {selected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PageTransition>
      )}

      {/* Bottom: Previous / Next / Submit Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          disabled={activeIdx === 0}
          onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {activeIdx < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveIdx((i) => i + 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitQuiz}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Grading Assessment...' : 'Submit Quiz for Grading'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// 4. QUIZ RESULT & DIAGNOSTIC PAGE
export const QuizResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    quizzesApi.getResult(id).then((res) => setData(res));
  }, [id]);

  if (!data) {
    return <SkeletonPage />;
  }

  const { quiz, latestAttempt } = data;
  if (!latestAttempt) {
    return (
      <EmptyState
        icon={HelpCircle}
        title="No attempts recorded yet"
        description="Complete and submit this quiz to view your question-by-question diagnostic report."
        actionLabel="Take Quiz Now"
        onAction={() => (window.location.href = `/quiz/${id}`)}
      />
    );
  }

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (latestAttempt.percentage || 0) / 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/quiz" className="text-xs font-medium text-slate-500 hover:text-slate-900">
          ← Back to All Quizzes
        </Link>
        <Link
          to={`/quiz/${quiz._id}`}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Retake Assessment
        </Link>
      </div>

      {/* Diagnostic Summary Header with Animated Score Ring */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2 max-w-xl">
          <p className="text-xs text-indigo-400 font-medium">
            {quiz.subject} · {quiz.topic}
          </p>
          <h1 className="type-h1 text-white">{quiz.title} — Results</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {latestAttempt.performanceAnalysis}
          </p>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
              <circle
                cx="54"
                cy="54"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="54"
                cy="54"
                r={radius}
                fill="none"
                stroke={
                  latestAttempt.percentage >= 75
                    ? '#10B981'
                    : latestAttempt.percentage >= 50
                    ? '#F59E0B'
                    : '#F43F5E'
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums">
              <span className="text-xl font-bold text-white">{latestAttempt.percentage}%</span>
              <span className="text-[10px] text-slate-400">
                {latestAttempt.score}/{latestAttempt.totalQuestions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question-by-Question Review */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Question-by-Question Breakdown</h2>
        {(quiz.questions || []).map((q: any, idx: number) => {
          const ansRecord = (latestAttempt.answers || []).find(
            (a: any) => String(a.questionId) === String(q.id)
          );
          const isCorrect = ansRecord?.isCorrect;

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-6 space-y-3 transition-all ${
                isCorrect ? 'border-emerald-200/90' : 'border-rose-200/90'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-mono font-semibold text-slate-500">
                  Question {idx + 1}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    isCorrect ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Incorrect</span>
                    </>
                  )}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900">{q.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div
                  className={`p-3 rounded-xl border ${
                    isCorrect
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <span className="font-semibold block mb-0.5">Your Answer:</span>
                  <span>{ansRecord?.userAnswer || '(Left Blank)'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                  <span className="font-semibold block mb-0.5">Correct Answer:</span>
                  <span>{q.correctAnswer}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Concept Explanation: </strong>
                {q.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. DOCUMENTS & RAG WORKSPACE PAGE
export const DocumentsPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<
    'idle' | 'hover' | 'uploading' | 'processing' | 'complete' | 'error'
  >('idle');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [ragQuestion, setRagQuestion] = useState('');
  const [ragAnswer, setRagAnswer] = useState<any>(null);
  const [asking, setAsking] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const [docRes, subjRes] = await Promise.all([
        documentsApi.getAll(),
        subjectsApi.getAll(),
      ]);
      setDocuments(docRes.documents || []);
      setSubjects(subjRes.subjects || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a PDF, DOCX, or TXT file first.', 'error');
      return;
    }
    setUploadState('uploading');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('subject', subject);

      setTimeout(() => {
        setUploadState((prev) => (prev === 'uploading' ? 'processing' : prev));
      }, 400);

      const res = await documentsApi.upload(formData);
      setUploadState('complete');
      showToast(
        `Uploaded & indexed "${res.document.originalName}" (${res.document.chunkCount} chunks)!`,
        'success'
      );
      setSelectedFile(null);
      loadDocs();
      setTimeout(() => setUploadState('idle'), 2000);
    } catch (err: any) {
      setUploadState('error');
      showToast(err?.response?.data?.message || 'Document upload failed.', 'error');
    }
  };

  const handleGlobalRagAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuestion.trim()) return;
    setAsking(true);
    try {
      const res = await documentsApi.ask({
        documentId: 'all',
        question: ragQuestion,
      });
      setRagAnswer(res);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'RAG search failed.', 'error');
    } finally {
      setAsking(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await documentsApi.delete(deleteId);
    showToast('Document and vector chunks deleted.', 'info');
    setDeleteId(null);
    loadDocs();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="type-h1 text-slate-900">Document Library &amp; RAG Knowledge Base</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload PDF, DOCX, or TXT study materials. Documents are automatically chunked, embedded,
          and indexed for source-cited Retrieval-Augmented Generation (RAG) Q&amp;A.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Drag & Drop Upload Zone */}
        <form
          onSubmit={handleUpload}
          className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 flex flex-col justify-between shadow-xs"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Upload Study Document</h2>
            <p className="text-xs text-slate-500 mb-4">
              Supported formats: <span className="font-mono">.pdf, .docx, .txt, .md</span> (max
              10MB)
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Subject Tag
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                if (uploadState === 'idle') setUploadState('hover');
              }}
              onDragLeave={() => {
                if (uploadState === 'hover') setUploadState('idle');
              }}
              onDrop={(e) => {
                e.preventDefault();
                setUploadState('idle');
                const file = e.dataTransfer.files?.[0];
                if (file) setSelectedFile(file);
              }}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${
                uploadState === 'hover'
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : uploadState === 'error'
                  ? 'border-rose-300 bg-rose-50/30'
                  : uploadState === 'complete'
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 mb-2 shadow-2xs">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 text-center">
                {selectedFile
                  ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`
                  : uploadState === 'hover'
                  ? 'Drop your study document here'
                  : 'Drag & drop or click to select a PDF, DOCX, or TXT file'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {uploadState === 'uploading'
                  ? 'Uploading file to secure workspace...'
                  : uploadState === 'processing'
                  ? 'Extracting pages & generating vector embeddings...'
                  : uploadState === 'complete'
                  ? 'Document indexed and ready for RAG Q&A!'
                  : 'Automatic text extraction, chunking, and vector indexing'}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                  setUploadState('idle');
                }}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={uploadState === 'uploading' || uploadState === 'processing' || !selectedFile}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50"
          >
            {uploadState === 'uploading' || uploadState === 'processing'
              ? 'Extracting & Indexing Chunks...'
              : 'Upload & Process Document'}
          </button>
        </form>

        {/* Cross-Document RAG Search Box */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Ask Across All Uploaded Documents (RAG)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Retrieves relevant document chunks via vector similarity and cites exact page numbers.
            </p>

            <form onSubmit={handleGlobalRagAsk} className="flex gap-2">
              <input
                type="text"
                value={ragQuestion}
                onChange={(e) => setRagQuestion(e.target.value)}
                placeholder="e.g., What is the time complexity of B+ Tree search?"
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={asking}
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {asking ? 'Searching...' : 'Ask RAG'}
              </button>
            </form>

            {ragAnswer && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 max-h-64 overflow-y-auto">
                <MarkdownRenderer content={ragAnswer.answer} />
                {ragAnswer.citations?.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-700">
                      Retrieved Source Citations:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ragAnswer.citations.map((c: any) => (
                        <Link
                          key={c.chunkId}
                          to={`/documents/${c.documentId}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200/80 text-[11px] font-mono transition-colors"
                        >
                          <span>{c.documentName}</span>
                          <span className="font-semibold">[Page {c.pageNumber}]</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Library Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Your Indexed Documents</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No study documents uploaded yet"
            description="Upload a PDF, DOCX, or TXT lecture packet above to build your searchable RAG knowledge library."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <AnimatedCard
                key={doc._id}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-slate-500">
                      <span className="uppercase">{doc.fileType}</span>
                      <span> · </span>
                      <span>{doc.pageCount}p</span>
                      <span> · </span>
                      <span>{doc.chunkCount} chunks</span>
                    </div>
                  </div>
                  <Link
                    to={`/documents/${doc._id}`}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors block mb-1 truncate"
                  >
                    {doc.originalName}
                  </Link>
                  <p className="text-xs text-indigo-600 font-medium mb-2">{doc.subject}</p>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {doc.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/documents/${doc._id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Open RAG Workspace →
                  </Link>
                  <button
                    onClick={() => setDeleteId(doc._id)}
                    aria-label={`Delete ${doc.originalName}`}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Document"
        description="Are you sure you want to delete this document and all of its vector chunks?"
        confirmLabel="Delete Document"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// 6. DOCUMENT DETAIL & DEDICATED RAG Q&A PAGE
export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [doc, setDoc] = useState<any>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; result: any }>>([]);
  const [asking, setAsking] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    documentsApi.getById(id).then((res) => {
      setDoc(res.document);
      setChunks(res.chunks || []);
    });
  }, [id]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !id) return;
    const q = question.trim();
    setQuestion('');
    setAsking(true);
    try {
      const result = await documentsApi.ask({ documentId: id, question: q });
      setQaHistory((prev) => [{ question: q, result }, ...prev]);
    } catch {
      showToast('Failed to query document.', 'error');
    } finally {
      setAsking(false);
    }
  };

  if (!doc) {
    return <SkeletonPage />;
  }

  return (
    <div className="space-y-6">
      <Link to="/documents" className="text-xs font-medium text-slate-500 hover:text-slate-900">
        ← Back to Document Library
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mb-1">
          <span className="text-indigo-600 font-sans font-semibold">{doc.subject}</span>
          <span>·</span>
          <span className="uppercase">{doc.fileType}</span>
          <span>·</span>
          <span>{doc.pageCount} Pages</span>
          <span>·</span>
          <span>{doc.chunkCount} Indexed Vector Chunks</span>
        </div>
        <h1 className="type-h1 text-slate-900 mb-2">{doc.originalName}</h1>
        <p className="text-xs text-slate-600 leading-relaxed">{doc.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: RAG Q&A Panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ask Questions About This Document
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every response is grounded in retrieved document chunks with interactive{' '}
              <code className="font-mono text-indigo-600">[Page X]</code> source badges.
            </p>
          </div>

          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a specific question about concepts, formulas, or definitions in this file..."
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={asking}
              className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              {asking ? 'Retrieving...' : 'Ask Document'}
            </button>
          </form>

          <div className="space-y-4">
            {qaHistory.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <p className="text-xs text-slate-500">
                  Ask any question above to retrieve relevant passages and page citations from{' '}
                  <strong className="text-slate-700">{doc.originalName}</strong>.
                </p>
              </div>
            ) : (
              qaHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-3"
                >
                  <p className="text-xs font-bold text-slate-900">Q: {item.question}</p>
                  <MarkdownRenderer content={item.result.answer} />
                  {item.result.citations?.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-700">
                        Interactive Source Citations (click to inspect passage):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.result.citations.map((c: any) => (
                          <button
                            key={c.chunkId}
                            type="button"
                            onClick={() => setSelectedCitation(c)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-colors ${
                              selectedCitation?.chunkId === c.chunkId
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
                            }`}
                          >
                            [Page {c.pageNumber}] · Match {Math.round((c.score || 0.8) * 100)}%
                          </button>
                        ))}
                      </div>

                      {selectedCitation &&
                        item.result.citations.some(
                          (c: any) => c.chunkId === selectedCitation.chunkId
                        ) && (
                          <div className="p-3 rounded-lg bg-white border border-indigo-200 text-[11px] text-slate-700 font-mono leading-relaxed">
                            <div className="font-semibold text-indigo-700 mb-1">
                              Source Excerpt — Page {selectedCitation.pageNumber}:
                            </div>
                            "{selectedCitation.snippet}"
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Indexed Chunks Inspector */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3 max-h-[620px] overflow-y-auto shadow-xs">
          <h2 className="text-base font-bold text-slate-900">
            Extracted Chunks ({chunks.length})
          </h2>
          {chunks.map((chunk) => (
            <div
              key={chunk._id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums">
                <span>Chunk #{chunk.chunkIndex + 1}</span>
                <span className="text-indigo-600 font-semibold">[Page {chunk.pageNumber}]</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{chunk.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
