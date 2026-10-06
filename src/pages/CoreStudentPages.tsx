import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Flame,
  Clock,
  Award,
  CheckCircle2,
  Bot,
  FileText,
  HelpCircle,
  FolderKanban,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  Plus,
  Search,
  CheckSquare,
  Compass,
  Target,
  ArrowDown,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { subjectsApi } from '../api/subjects';
import { topicsApi } from '../api/topics';
import { progressApi } from '../api/progress';
import { studyTasksApi } from '../api/studyTasks';
import { goalsApi } from '../api/goals';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  AnimatedCard,
  SkeletonPage,
  SkeletonCard,
  EmptyState,
  ErrorState,
  getSubjectVisual,
} from '../components/ui/MotionAndStates';

// 1. STUDENT DASHBOARD PAGE (AI Learning Command Center)
export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getStudentDashboard();
      const dashboardData = res?.dashboard || res?.data?.dashboard || res;
      setData(dashboardData);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleTask = async (task: any) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await studyTasksApi.updateStatus(task._id, nextStatus);
      showToast(nextStatus === 'completed' ? 'Study task completed!' : 'Task reopened.', 'success');
      loadDashboard();
      refreshUser();
    } catch {
      showToast('Failed to update task.', 'error');
    }
  };

  if (loading) {
    return <SkeletonPage />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Unable to load dashboard.'} onRetry={loadDashboard} />;
  }

  const stats = data?.stats || {};
  const weeklyChart = data?.weeklyStudyChart || data?.dailySeries || [];
  const upcomingTasks = data?.upcomingTasks || [];
  const weakTopics = data?.weakTopics || [];
  const recommendations = data?.recommendations || [];
  const recentActivities = data?.recentActivities || [];
  const subjectProgress = data?.subjectProgress || [];
  const activeGoal = (data?.goals || [])[0];

  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const taskCompletionPct =
    stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-7">
      {/* Top Command Banner */}
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-6 sm:p-7 relative overflow-hidden shadow-lg">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-sky-500/15 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-300 font-medium">
              <span>Academic Command Center</span>
              <span aria-hidden="true">·</span>
              <span>{user?.educationLevel || 'Computer Science'}</span>
            </div>
            <h1 className="type-h1 text-white">
              {greeting}, {firstName}.
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {activeGoal
                ? `Current Goal: ${activeGoal.title} (${activeGoal.currentValue}/${activeGoal.targetValue} ${activeGoal.unit})`
                : 'Your adaptive study plan, quiz diagnostics, and AI tutor sessions are synchronized below.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/ai-tutor"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-sm whitespace-nowrap"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI Tutor</span>
            </Link>
            <Link
              to="/notes"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Generate Notes</span>
            </Link>
            <Link
              to="/quiz/create"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <span>Take a Quiz</span>
            </Link>
            <Link
              to="/flashcards"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Flashcards</span>
            </Link>
          </div>
        </div>

        {/* Today's Progress Summary Strip */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Current Goal Status</span>
            <span className="font-semibold text-white truncate block mt-0.5">
              {activeGoal ? activeGoal.title : 'Master Core CS Modules'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Active Study Streak</span>
            <span className="font-mono font-semibold text-amber-400 tabular-nums block mt-0.5">
              {stats.streakDays || 1} Days Active
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Task Completion</span>
            <span className="font-mono font-semibold text-emerald-400 tabular-nums block mt-0.5">
              {stats.completedTasks || 0}/{stats.totalTasks || 0} ({taskCompletionPct}%)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Cumulative Study Time</span>
            <span className="font-mono font-semibold text-sky-400 tabular-nums block mt-0.5">
              {stats.totalStudyHours || 0}h ({stats.totalStudyMinutes || 0}m)
            </span>
          </div>
        </div>
      </div>

      {/* 4 Premium KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard interactive={false} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Study Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.streakDays || 1} Days
          </div>
          <p className="text-xs text-slate-500 mt-1">Consecutive daily learning sessions</p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.streakDays || 1) * 14)}%` }}
            />
          </div>
        </AnimatedCard>

        <AnimatedCard interactive={false} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Hours Learned</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalStudyHours || 0} hrs
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {stats.totalStudyMinutes || 0} total minutes logged
          </p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round(((stats.totalStudyMinutes || 0) / 600) * 100))}%` }}
            />
          </div>
        </AnimatedCard>

        <AnimatedCard interactive={false} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Quiz Accuracy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.averageQuizScore || 0}%
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            Across {stats.quizzesTaken || 0} graded assessments
          </p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.averageQuizScore || 0)}%` }}
            />
          </div>
        </AnimatedCard>

        <AnimatedCard interactive={false} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Topics Completed</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.completedTopicsCount || 0} / {stats.totalTopicsCount || 32}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {stats.overallCompletionPercentage || 0}% overall curriculum mastery
          </p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.overallCompletionPercentage || 0)}%` }}
            />
          </div>
        </AnimatedCard>
      </div>

      {/* Main Analytics & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Time Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Weekly Study Velocity</h2>
              <p className="text-xs text-slate-500">
                Minutes spent studying across reading, AI tutor, and quizzes over the last 7 days
              </p>
            </div>
            <Link
              to="/progress"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 whitespace-nowrap"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.26} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#studyAreaGrad)"
                  name="Study Minutes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Priority Study Tasks */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Priority Study Tasks</h2>
              <Link to="/tasks" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                All scheduled tasks are complete! Generate a new AI Study Plan to continue.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingTasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task._id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:border-indigo-200 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleTask(task)}
                      aria-label={`Mark ${task.title} completed`}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                        <span>{task.subject || 'General'}</span>
                        <span>·</span>
                        <span>{task.estimatedDuration}m</span>
                        <span>·</span>
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/study-plans"
            className="mt-4 w-full py-2.5 px-3 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors text-center block"
          >
            Open AI Study Planner
          </Link>
        </div>
      </div>

      {/* Subject Mastery & Weak Topics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Completion Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Subject Mastery</h2>
            <Link to="/subjects" className="text-xs font-semibold text-indigo-600 hover:underline">
              Curriculum
            </Link>
          </div>
          <div className="space-y-3.5">
            {subjectProgress.slice(0, 6).map((sp: any) => {
              const visual = getSubjectVisual(sp.subjectName);
              return (
                <div key={sp.subjectId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-800 truncate pr-2">
                      {sp.subjectName}
                    </span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {sp.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${visual.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${sp.completionPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Topics Detection & Personalized Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Weak Topic Diagnostics</h2>
              </div>
              <Link
                to="/recommendations"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Action Plan
              </Link>
            </div>

            {weakTopics.length === 0 ? (
              <p className="text-xs text-slate-500 py-6">
                No weak topics flagged yet. Take a topic quiz to benchmark your conceptual accuracy!
              </p>
            ) : (
              <div className="space-y-3">
                {weakTopics.slice(0, 3).map((wt: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">{wt.topic}</span>
                      <span className="text-[11px] font-mono text-amber-800 tabular-nums">
                        {wt.averageScore > 0 ? `${wt.averageScore}% avg` : `${wt.completionPercentage}% done`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{wt.reason}</p>
                    <p className="text-[11px] text-indigo-700 font-medium">{wt.suggestedAction}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">Next Recommended Step</p>
              <Link
                to={recommendations[0].actionUrl || '/recommendations'}
                className="flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span className="truncate">{recommendations[0].title}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent Learning Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
            <Link to="/history" className="text-xs font-semibold text-indigo-600 hover:underline">
              Full History
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((act: any) => (
              <div
                key={act._id}
                className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{act.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {act.subject || 'General'} {act.topic ? `· ${act.topic}` : ''}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                  {new Date(act.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. SUBJECTS PAGE (Unique Visual Identity per CS Subject)
export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([subjectsApi.getAll(), progressApi.getSubjects()])
      .then(([subjRes, progRes]) => {
        setSubjects(subjRes.subjects || []);
        const map: Record<string, any> = {};
        (progRes?.subjectProgress || progRes?.progress || []).forEach((p: any) => {
          const key = p.subjectName || p.subject;
          if (key) map[key] = p;
        });
        setSubjectProgress(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || s.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-slate-900">Curriculum Subjects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore 8 structured Computer Science domains with 32 interactive learning modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter subjects..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  difficultyFilter === diff
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No matching subjects found"
          description="Try clearing your search filter or switching the difficulty level tab."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setDifficultyFilter('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((subj) => {
            const prog = subjectProgress[subj.name] || {
              completionPercentage: 0,
              completedTopics: 0,
              totalTopics: subj.topicCount || 4,
            };
            const visual = getSubjectVisual(subj.name, subj.category);
            const Icon = visual.icon;

            return (
              <Link key={subj._id} to={`/subjects/${subj._id}`} className="block group">
                <AnimatedCard className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl ${visual.accentBg} border ${visual.accentBorder} ${visual.accentText} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{subj.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{subj.difficulty}</span>
                      </div>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                      {subj.name}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {subj.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-mono tabular-nums">
                      <span className="text-slate-500">
                        {prog.completedTopics}/{prog.totalTopics} modules mastered
                      </span>
                      <span className="font-semibold text-slate-900">
                        {prog.completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${visual.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${prog.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </AnimatedCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 3. SUBJECT DETAIL PAGE (Visual Learning-Path Journey: Module 01 ↓ Module 02 ↓ Module 03 ↓ Module 04)
export const SubjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [subject, setSubject] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [topicProgress, setTopicProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadSubjectDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [subjRes, progRes] = await Promise.all([
        subjectsApi.getById(id),
        progressApi.getTopics(),
      ]);
      setSubject(subjRes.subject);
      setTopics(subjRes.topics || []);
      const map: Record<string, any> = {};
      (progRes.topicProgress || []).forEach((tp: any) => {
        map[tp.topic] = tp;
      });
      setTopicProgress(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjectDetails();
  }, [id]);

  const handleMarkCompleted = async (topicObj: any) => {
    try {
      await progressApi.markTopicStudied({
        subject: subject.name,
        topic: topicObj.name,
        completionPercentage: 100,
        studyTimeMinutes: topicObj.estimatedStudyTime || 45,
      });
      showToast(`Marked "${topicObj.name}" as 100% mastered!`, 'success');
      loadSubjectDetails();
    } catch {
      showToast('Failed to update topic progress.', 'error');
    }
  };

  if (loading) {
    return <SkeletonPage />;
  }

  if (!subject) {
    return <ErrorState message="Subject not found." />;
  }

  const visual = getSubjectVisual(subject.name, subject.category);
  const SubjectIcon = visual.icon;

  // Determine the index of the current active module (first module with completion < 80%)
  const activeIndex = (() => {
    const idx = topics.findIndex(
      (t) => (topicProgress[t.name]?.completionPercentage || 0) < 80
    );
    return idx === -1 ? topics.length - 1 : idx;
  })();

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/subjects"
          className="text-xs font-medium text-slate-500 hover:text-slate-900 mb-3 inline-block"
        >
          ← Back to All Subjects
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl ${visual.accentBg} border ${visual.accentBorder} ${visual.accentText} flex items-center justify-center shrink-0`}
            >
              <SubjectIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{subject.category}</span>
                <span>·</span>
                <span>{subject.difficulty}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">{topics.length} Learning Modules</span>
              </div>
              <h1 className="type-h1 text-slate-900 mb-2">{subject.name}</h1>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                {subject.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to={`/ai-tutor?subject=${encodeURIComponent(subject.name)}`}
              className="px-4 py-2.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-xs whitespace-nowrap"
            >
              Open Subject AI Tutor
            </Link>
            <Link
              to={`/quiz/create?subject=${encodeURIComponent(subject.name)}`}
              className="px-4 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              Generate Subject Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Learning-Path Journey */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Guided Learning Path</h2>
            <p className="text-xs text-slate-500">
              Follow the sequential module progression below to build complete conceptual mastery.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {topics.filter((t) => (topicProgress[t.name]?.completionPercentage || 0) >= 80).length}{' '}
            of {topics.length} Modules Completed
          </span>
        </div>

        <div className="space-y-3">
          {topics.map((topic, idx) => {
            const prog = topicProgress[topic.name] || {
              completionPercentage: 0,
              averageScore: 0,
            };
            const isCompleted = prog.completionPercentage >= 80;
            const isCurrent = idx === activeIndex && !isCompleted;
            const isUpcoming = idx > activeIndex && !isCompleted;

            return (
              <React.Fragment key={topic._id}>
                <div
                  className={`relative rounded-2xl border p-6 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-white border-emerald-200/90 shadow-xs'
                      : isCurrent
                      ? 'bg-white border-indigo-400 ring-4 ring-indigo-500/10 shadow-md'
                      : 'bg-slate-50/70 border-slate-200/80 opacity-90 hover:opacity-100 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono font-semibold tabular-nums ${
                            isCompleted
                              ? 'text-emerald-700'
                              : isCurrent
                              ? 'text-indigo-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : isCurrent ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse-subtle" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>Module {String(idx + 1).padStart(2, '0')}</span>
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-slate-600">{topic.difficulty}</span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          {topic.estimatedStudyTime} mins
                        </span>
                        {isCompleted && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="text-emerald-700 font-semibold">Completed</span>
                          </>
                        )}
                        {isCurrent && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="text-indigo-600 font-semibold">
                              Current Recommended Module
                            </span>
                          </>
                        )}
                      </div>

                      <Link
                        to={`/topics/${topic._id}`}
                        className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors inline-block"
                      >
                        {topic.name}
                      </Link>
                      <p className="text-xs text-slate-600 leading-relaxed">{topic.description}</p>

                      {topic.keyConcepts?.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">Key Concepts:</span>
                          {topic.keyConcepts.map((kc: string, i: number) => (
                            <React.Fragment key={kc}>
                              <span>{kc}</span>
                              {i < topic.keyConcepts.length - 1 && <span>·</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <div className="text-left lg:text-right font-mono text-xs tabular-nums">
                        <span className="text-slate-500">Mastery: </span>
                        <span
                          className={`font-bold ${
                            isCompleted ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {prog.completionPercentage}%
                        </span>
                        {prog.averageScore > 0 && (
                          <span className="text-slate-500 ml-2">
                            · Quiz: {prog.averageScore}%
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/topics/${topic._id}`}
                          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            isCurrent
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isCurrent ? 'Continue Module' : 'Study Module'}
                        </Link>
                        <Link
                          to={`/notes?subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(topic.name)}`}
                          className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                        >
                          AI Notes
                        </Link>
                        <Link
                          to={`/quiz/create?subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(topic.name)}`}
                          className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                        >
                          Quiz
                        </Link>
                        {!isCompleted && (
                          <button
                            onClick={() => handleMarkCompleted(topic)}
                            className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Journey Connector Arrow */}
                {idx < topics.length - 1 && (
                  <div className="flex justify-center py-0.5" aria-hidden="true">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 4. TOPIC DETAIL PAGE
export const TopicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadTopic = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await topicsApi.getById(id);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopic();
  }, [id]);

  const handleMarkStudied = async () => {
    if (!data?.topic) return;
    try {
      await progressApi.markTopicStudied({
        subject: data.topic.subject,
        topic: data.topic.name,
        completionPercentage: 100,
        studyTimeMinutes: data.topic.estimatedStudyTime || 45,
      });
      showToast('Topic marked as studied!', 'success');
      loadTopic();
    } catch {
      showToast('Failed to update topic progress.', 'error');
    }
  };

  if (loading) return <SkeletonPage />;
  if (!data?.topic) return <ErrorState message="Topic not found." />;

  const { topic, progress, relatedNotes = [], relatedQuizzes = [] } = data;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to Subject Curriculum
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{topic.subject}</span>
              <span>·</span>
              <span>{topic.difficulty}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{topic.estimatedStudyTime} mins</span>
            </div>
            <h1 className="type-h1 text-slate-900">{topic.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to={`/ai-tutor?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ask AI Tutor
            </Link>
            <Link
              to={`/notes?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Generate AI Notes
            </Link>
            <Link
              to={`/quiz/create?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Take Topic Quiz
            </Link>
            <button
              onClick={handleMarkStudied}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Mark 100% Mastered
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">{topic.description}</p>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <h3 className="text-xs font-semibold text-slate-900">Executive Content Summary</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{topic.contentSummary}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2">Prerequisites</h3>
            <div className="text-xs text-slate-600">
              {(topic.prerequisites || []).join(' · ') || 'None'}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2">Core Concepts</h3>
            <div className="text-xs text-slate-600">
              {(topic.keyConcepts || []).join(' · ') || 'Core Fundamentals'}
            </div>
          </div>
        </div>

        {progress && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-mono tabular-nums text-slate-600">
            <span>Completion: {progress.completionPercentage}%</span>
            <span>·</span>
            <span>Study Time: {progress.studyTime} mins</span>
            <span>·</span>
            <span>Quiz Attempts: {progress.quizAttempts}</span>
            <span>·</span>
            <span>Average Quiz Score: {progress.averageScore}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/90 p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Saved Notes for This Topic</h2>
          {relatedNotes.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved notes yet. Click "Generate AI Notes" above to synthesize comprehensive study
              notes.
            </p>
          ) : (
            <div className="space-y-2">
              {relatedNotes.map((n: any) => (
                <Link
                  key={n._id}
                  to={`/notes/${n._id}`}
                  className="block p-3 rounded-lg bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/60 text-xs font-medium text-slate-900"
                >
                  {n.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Quizzes for This Topic</h2>
          {relatedQuizzes.length === 0 ? (
            <p className="text-xs text-slate-500">
              No quizzes generated yet. Click "Take Topic Quiz" above to test your mastery.
            </p>
          ) : (
            <div className="space-y-2">
              {relatedQuizzes.map((q: any) => (
                <Link
                  key={q._id}
                  to={`/quiz/${q._id}`}
                  className="block p-3 rounded-lg bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/60 text-xs font-medium text-slate-900"
                >
                  {q.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 5. PROFILE PAGE
export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(15);

  const loadGoals = () => {
    goalsApi.getAll().then((res) => setGoals(res.goals || []));
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    try {
      await goalsApi.create({
        title: newGoalTitle,
        targetValue: newGoalTarget,
        currentValue: 0,
        unit: 'hours',
      });
      setNewGoalTitle('');
      showToast('Learning goal created!', 'success');
      loadGoals();
    } catch {
      showToast('Failed to add goal.', 'error');
    }
  };

  const handleIncrementGoal = async (g: any) => {
    await goalsApi.update(g._id, { currentValue: g.currentValue + 1 });
    loadGoals();
    refreshUser();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl font-bold font-display shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
            <p className="text-xs text-slate-500">
              {user?.email} · {user?.educationLevel} · <span className="capitalize">{user?.role}</span>
            </p>
            <p className="text-xs text-slate-600 mt-1.5 max-w-xl">
              {user?.bio || 'Dedicated computer science student mastering systems and AI.'}
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          Edit Profile &amp; Security
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Active Learning Goals</h2>
        <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="Add a new academic goal (e.g., Complete 20 DSA hours)..."
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <input
            type="number"
            min={1}
            max={500}
            value={newGoalTarget}
            onChange={(e) => setNewGoalTarget(Number(e.target.value))}
            className="w-28 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Add Goal
          </button>
        </form>

        <div className="space-y-3 pt-2">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / (g.targetValue || 1)) * 100));
            return (
              <div key={g._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-900">{g.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-600 tabular-nums">
                      {g.currentValue} / {g.targetValue} {g.unit} ({pct}%)
                    </span>
                    <button
                      onClick={() => handleIncrementGoal(g)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-md hover:border-indigo-400"
                    >
                      +1 {g.unit}
                    </button>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 6. SETTINGS PAGE
export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(
    user?.studyPreferences?.dailyGoalMinutes || 120
  );
  const [preferredTime, setPreferredTime] = useState(
    user?.studyPreferences?.preferredTime || 'Evening'
  );
  const [difficultyLevel, setDifficultyLevel] = useState(
    user?.studyPreferences?.difficultyLevel || 'Intermediate'
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({
        name,
        educationLevel,
        bio,
        studyPreferences: {
          dailyGoalMinutes: Number(dailyGoalMinutes),
          preferredTime,
          difficultyLevel,
        },
      });
      updateUser(res.user);
      showToast('Profile and study preferences saved!', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersApi.updatePassword({ currentPassword, newPassword });
      if (res.token) {
        localStorage.setItem('lumina_token', res.token);
      }
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="type-h1 text-slate-900">Account &amp; Study Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure your profile details, daily study targets, and account security.
        </p>
      </div>

      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4"
      >
        <h2 className="text-base font-bold text-slate-900">Academic Profile &amp; Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Education Level</label>
            <input
              type="text"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Academic Bio</label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Daily Target (mins)
            </label>
            <input
              type="number"
              min={15}
              max={600}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Preferred Study Window
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Default AI Difficulty
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Save Profile Preferences
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordChange}
        className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4"
      >
        <h2 className="text-base font-bold text-slate-900">Change Password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              New Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          Update Password
        </button>
      </form>
    </div>
  );
};
