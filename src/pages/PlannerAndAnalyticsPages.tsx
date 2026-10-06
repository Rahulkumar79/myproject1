import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  Compass,
  RefreshCw,
  History,
  Search,
  BookOpen,
  FileText,
  HelpCircle,
  FolderKanban,
  ArrowRight,
  Award,
  Flame,
  CheckSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { studyPlansApi } from '../api/studyPlans';
import { studyTasksApi } from '../api/studyTasks';
import { progressApi } from '../api/progress';
import { recommendationsApi } from '../api/recommendations';
import { activitiesApi } from '../api/activities';
import { searchApi } from '../api/search';
import { subjectsApi } from '../api/subjects';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import {
  AnimatedCard,
  SkeletonCard,
  SkeletonPage,
  EmptyState,
  getSubjectVisual,
} from '../components/ui/MotionAndStates';

// 1. STUDY PLANS PAGE
export const StudyPlansPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('Midterm CS Mastery Schedule');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'Data Structures & Algorithms',
    'Database Management Systems (DBMS)',
  ]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([
    'Data Structures & Algorithms',
  ]);
  const [dailyHours, setDailyHours] = useState(3);
  const [examDate, setExamDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [knowledgeLevel, setKnowledgeLevel] = useState('Intermediate');
  const [preferredStudyTime, setPreferredStudyTime] = useState('Evening');

  const loadData = async () => {
    setLoading(true);
    try {
      const [planRes, subjRes] = await Promise.all([
        studyPlansApi.getAll(),
        subjectsApi.getAll(),
      ]);
      setPlans(planRes.studyPlans || []);
      setSubjects(subjRes.subjects || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSubject = (name: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(name) ? list.filter((x) => x !== name) : [...list, name]);
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await studyPlansApi.create({
        title,
        subjects: selectedSubjects,
        weakSubjects,
        dailyHours,
        startDate: new Date().toISOString().split('T')[0],
        examDate,
        knowledgeLevel,
        preferredStudyTime,
      });
      showToast('Personalized AI Study Plan & Tasks generated!', 'success');
      navigate(`/study-plans/${res.studyPlan._id}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to generate study plan.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await studyPlansApi.delete(deleteId);
    showToast('Study plan deleted.', 'info');
    setDeleteId(null);
    loadData();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="type-h1 text-slate-900">Adaptive AI Study Planner</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate realistic daily and weekly study schedules tailored to your exam dates, weak
          subjects, and exact daily hour capacity.
        </p>
      </div>

      {/* Generator Form */}
      <form
        onSubmit={handleGeneratePlan}
        className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Create New Adaptive Study Plan</h2>
            <p className="text-[11px] text-slate-500">
              Automatically schedules study, practice, revision, and quiz blocks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Plan Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Exam Date
            </label>
            <input
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Daily Study Capacity (hrs)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Target Subjects
            </label>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const active = selectedSubjects.includes(s.name);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleSubject(s.name, selectedSubjects, setSelectedSubjects)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Weak Subjects (Prioritized with High Weight)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const active = weakSubjects.includes(s.name);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleSubject(s.name, weakSubjects, setWeakSubjects)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      active
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Knowledge Level
            </label>
            <select
              value={knowledgeLevel}
              onChange={(e) => setKnowledgeLevel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Preferred Study Time
            </label>
            <select
              value={preferredStudyTime}
              onChange={(e) => setPreferredStudyTime(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            >
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50"
          >
            {creating ? 'Generating Adaptive Schedule...' : 'Generate AI Study Plan'}
          </button>
        </div>
      </form>

      {/* Existing Study Plans */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Your Study Plans</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No study plans created yet"
            description="Generate your first adaptive AI study schedule above to automatically organize daily tasks by exam date and weak subjects."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plans.map((plan) => (
              <AnimatedCard
                key={plan._id}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums mb-2">
                    <span>{plan.dailyHours} hrs/day</span>
                    <span>Exam: {plan.examDate}</span>
                  </div>
                  <Link
                    to={`/study-plans/${plan._id}`}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors block mb-1.5"
                  >
                    {plan.title}
                  </Link>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {plan.description}
                  </p>
                  {plan.weakSubjects?.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900">
                      <span className="font-semibold">Priority Remediation: </span>
                      <span>{plan.weakSubjects.join(' · ')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/study-plans/${plan._id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View Timeline &amp; Tasks →
                  </Link>
                  <button
                    onClick={() => setDeleteId(plan._id)}
                    aria-label={`Delete ${plan.title}`}
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
        title="Delete Study Plan"
        description="Deleting this study plan will also remove all scheduled tasks associated with it."
        confirmLabel="Delete Plan"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// 2. STUDY PLAN DETAIL PAGE (Timeline & Daily Calendar Cards)
export const StudyPlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  const loadDetail = async () => {
    if (!id) return;
    const res = await studyPlansApi.getById(id);
    setPlan(res.studyPlan);
    setTasks(res.tasks || []);
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleToggleStatus = async (task: any) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    await studyTasksApi.updateStatus(task._id, next);
    showToast(next === 'completed' ? 'Task marked complete!' : 'Task reopened.', 'success');
    loadDetail();
  };

  if (!plan) {
    return <SkeletonPage />;
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Link to="/study-plans" className="text-xs font-medium text-slate-500 hover:text-slate-900">
        ← Back to Study Plans
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-indigo-600 font-semibold">
              {plan.knowledgeLevel} · {plan.dailyHours} hrs/day · {plan.preferredStudyTime}
            </p>
            <h1 className="type-h1 text-slate-900 mt-0.5">{plan.title}</h1>
            <p className="text-xs text-slate-600 mt-1">{plan.description}</p>
          </div>
          <div className="text-left sm:text-right font-mono tabular-nums">
            <div className="text-2xl font-bold text-indigo-600">{pct}%</div>
            <div className="text-xs text-slate-500">
              {completedCount}/{tasks.length} Tasks Completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {plan.weeklySummary?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {plan.weeklySummary.map((w: any) => (
              <div key={w.week} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Week {w.week} Milestone</span>
                  <span className="font-mono text-indigo-600 tabular-nums">
                    {w.hoursAllocated} hrs
                  </span>
                </div>
                <p className="text-xs text-slate-600">{w.focus}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Daily Tasks Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-2">
          Scheduled Daily Tasks ({tasks.length})
        </h2>
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const done = task.status === 'completed';
            return (
              <div
                key={task._id}
                className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  done
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-indigo-200 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => handleToggleStatus(task)}
                    aria-label={`Mark ${task.title} complete`}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <p
                      className={`text-xs font-bold transition-colors ${
                        done ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{task.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums mt-1.5">
                      <span>{task.scheduledDate}</span>
                      <span>·</span>
                      <span>{task.estimatedDuration} mins</span>
                      <span>·</span>
                      <span className="capitalize">{task.taskType}</span>
                      <span>·</span>
                      <span
                        className={`capitalize font-semibold ${
                          task.priority === 'high' ? 'text-amber-700' : 'text-slate-600'
                        }`}
                      >
                        {task.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 3. STUDY TASKS PAGE
export const TasksPage: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [estimatedDuration, setEstimatedDuration] = useState(45);
  const [priority, setPriority] = useState('medium');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadTasks = async () => {
    const res = await studyTasksApi.getAll();
    setTasks(res.tasks || []);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await studyTasksApi.create({
      title: title.trim(),
      subject,
      estimatedDuration,
      priority,
      scheduledDate: new Date().toISOString().split('T')[0],
    });
    setTitle('');
    showToast('Study task added!', 'success');
    loadTasks();
  };

  const handleStatusChange = async (task: any, nextStatus: string) => {
    await studyTasksApi.updateStatus(task._id, nextStatus);
    showToast(`Task status updated to ${nextStatus}`, 'success');
    loadTasks();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await studyTasksApi.delete(deleteId);
    showToast('Task deleted.', 'info');
    setDeleteId(null);
    loadTasks();
  };

  const filtered = tasks.filter((t) => filterStatus === 'all' || t.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-slate-900">Study Tasks &amp; Action Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage daily study tasks, mark completions, and track estimated study durations.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {['all', 'pending', 'in-progress', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Task Form */}
      <form
        onSubmit={handleAddTask}
        className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row gap-3 shadow-xs"
      >
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a custom study task (e.g., Implement QuickSort & MergeSort)..."
          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <input
          type="number"
          min={10}
          max={240}
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(Number(e.target.value))}
          className="w-24 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No study tasks in this filter"
          description="Add a custom study task above or generate a complete schedule in the AI Study Planner."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs">
          {filtered.map((task) => (
            <div
              key={task._id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="space-y-1">
                <p
                  className={`text-xs font-bold ${
                    task.status === 'completed'
                      ? 'line-through text-slate-400'
                      : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                  <span>{task.subject || 'General'}</span>
                  <span>·</span>
                  <span>{task.scheduledDate}</span>
                  <span>·</span>
                  <span>{task.estimatedDuration} mins</span>
                  <span>·</span>
                  <span className="capitalize">{task.priority} priority</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value)}
                  aria-label={`Change status for ${task.title}`}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium capitalize focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => setDeleteId(task._id)}
                  aria-label={`Delete ${task.title}`}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Study Task"
        description="Are you sure you want to delete this study task?"
        confirmLabel="Delete Task"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// 4. PROGRESS & ANALYTICS PAGE
export const ProgressPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi
      .getOverview()
      .then((res) => setData(res.analytics))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <SkeletonPage />;
  }

  if (!data) return null;

  const {
    stats = {},
    subjectProgress = [],
    topicProgress = [],
    weakTopics = [],
    weeklyStudyChart = [],
  } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="type-h1 text-slate-900">Learning Progress &amp; Mastery Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Quantitative breakdown of your study hours, subject completion, quiz accuracy, and
          automatically detected weak topics.
        </p>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard interactive={false} className="p-5">
          <p className="text-xs text-slate-500">Overall Curriculum Mastery</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats.overallCompletionPercentage}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            {stats.completedTopicsCount} of {stats.totalTopicsCount} modules completed
          </p>
        </AnimatedCard>
        <AnimatedCard interactive={false} className="p-5">
          <p className="text-xs text-slate-500">Total Study Hours</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 mt-1">
            {stats.totalStudyHours}h ({stats.totalStudyMinutes}m)
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Logged across focus &amp; reading sessions</p>
        </AnimatedCard>
        <AnimatedCard interactive={false} className="p-5">
          <p className="text-xs text-slate-500">Average Quiz Score</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            {stats.averageQuizScore}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            Across {stats.quizzesTaken} graded attempts
          </p>
        </AnimatedCard>
        <AnimatedCard interactive={false} className="p-5">
          <p className="text-xs text-slate-500">Tasks Completed</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-sky-600 mt-1">
            {stats.completedTasks} / {stats.totalTasks}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Scheduled study planner tasks</p>
        </AnimatedCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Subject Completion &amp; Quiz Performance (%)
            </h2>
            <p className="text-xs text-slate-500">
              Comparative completion percentage vs. average quiz accuracy per subject
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectProgress}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="subjectName"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="completionPercentage"
                  fill="#4F46E5"
                  name="Completion %"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="averageQuizScore"
                  fill="#10B981"
                  name="Avg Quiz Score %"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              7-Day Study Time Distribution (Minutes)
            </h2>
            <p className="text-xs text-slate-500">
              Daily focus and reading duration logged over the past week
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyStudyChart}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="progressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
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
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  fill="url(#progressAreaGrad)"
                  name="Study Minutes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weak Topics Diagnostic Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            Detected Weak Topics &amp; Suggested Remediation
          </h2>
        </div>

        {weakTopics.length === 0 ? (
          <p className="text-xs text-slate-500">
            No weak topics detected! All evaluated topics are currently above the mastery threshold.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Topic</th>
                  <th className="py-2.5 pr-4 font-semibold">Subject</th>
                  <th className="py-2.5 pr-4 font-semibold">Diagnostic Signal</th>
                  <th className="py-2.5 pr-4 font-semibold">Recommended Action</th>
                  <th className="py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weakTopics.map((wt: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-4 font-bold text-slate-900">{wt.topic}</td>
                    <td className="py-3 pr-4 text-slate-600">{wt.subject}</td>
                    <td className="py-3 pr-4 text-amber-800">{wt.reason}</td>
                    <td className="py-3 pr-4 text-slate-600">{wt.suggestedAction}</td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/ai-tutor?subject=${encodeURIComponent(wt.subject)}&topic=${encodeURIComponent(wt.topic)}`}
                        className="text-indigo-600 font-semibold hover:underline whitespace-nowrap"
                      >
                        Review with AI Tutor →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Topic-Level Mastery Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Topic-Level Progress Ledger</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Topic</th>
                <th className="py-2.5 pr-4 font-semibold">Subject</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Completion</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Study Time</th>
                <th className="py-2.5 font-semibold text-right">Avg Quiz Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {topicProgress.map((tp: any) => (
                <tr key={tp._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 pr-4 font-sans font-semibold text-slate-900">
                    {tp.topic}
                  </td>
                  <td className="py-2.5 pr-4 font-sans text-slate-600">{tp.subject}</td>
                  <td className="py-2.5 pr-4 text-right">{tp.completionPercentage}%</td>
                  <td className="py-2.5 pr-4 text-right">{tp.studyTime}m</td>
                  <td className="py-2.5 text-right">{tp.averageScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 5. RECOMMENDATIONS PAGE
export const RecommendationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecs = async () => {
    setLoading(true);
    try {
      const res = await recommendationsApi.getAll();
      setRecommendations(res.recommendations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await recommendationsApi.refresh();
      setRecommendations(res.recommendations || []);
      showToast('Recommendations recalculated from your latest quiz & study telemetry!', 'success');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'completed' | 'dismissed') => {
    await recommendationsApi.updateStatus(id, status);
    showToast(`Recommendation marked as ${status}.`, 'info');
    loadRecs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-slate-900">Personalized AI Study Recommendations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generated dynamically from your quiz scores, weak topics, pending tasks, and uploaded
            documents.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-xs whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Recalculate Recommendations</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="All current recommendations completed"
          description="Click Recalculate Recommendations above to generate fresh next-best-action steps from your latest quiz and study telemetry."
          actionLabel="Recalculate Now"
          onAction={handleRefresh}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendations.map((rec) => (
            <AnimatedCard
              key={rec._id}
              className="p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-indigo-600 capitalize">
                    {rec.type.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-slate-500 capitalize">
                    {rec.priority} priority
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mb-1.5">{rec.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{rec.description}</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
                  <strong className="text-slate-800">Diagnostic Reason: </strong>
                  {rec.reason}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={rec.actionUrl || '/subjects'}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start Action →
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(rec._id, 'completed')}
                    className="text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Mark Done
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => handleUpdateStatus(rec._id, 'dismissed')}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
};

// 6. LEARNING HISTORY & ACTIVITY LOG PAGE
export const HistoryPage: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activitiesApi
      .getAll()
      .then((res) => setActivities(res.activities || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activities.filter(
    (a) => typeFilter === 'all' || a.activityType === typeFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-slate-900">Learning Activity &amp; History Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chronological audit trail of your AI tutor conversations, generated notes, completed
            quizzes, uploaded documents, and study sessions.
          </p>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter activity history by type"
          className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium"
        >
          <option value="all">All Activity Types</option>
          <option value="tutor_session">AI Tutor Sessions</option>
          <option value="note_generated">Generated Notes</option>
          <option value="quiz_completed">Completed Quizzes</option>
          <option value="document_uploaded">Uploaded Documents</option>
          <option value="study_session">Logged Study Sessions</option>
          <option value="task_completed">Completed Tasks</option>
        </select>
      </div>

      {loading ? (
        <SkeletonCard />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No learning activities match this filter"
          description="Complete a quiz, generate study notes, or log a focus timer session to populate your activity timeline."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs">
          {filtered.map((act) => (
            <div
              key={act._id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{act.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="capitalize">{act.activityType.replace('_', ' ')}</span>
                  {act.subject && (
                    <>
                      <span>·</span>
                      <span>{act.subject}</span>
                    </>
                  )}
                  {act.topic && (
                    <>
                      <span>·</span>
                      <span>{act.topic}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
                {new Date(act.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 7. GLOBAL SEARCH PAGE
export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await searchApi.globalSearch(q.trim());
      setResults(res.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQ) {
      setQuery(initialQ);
      runSearch(initialQ);
    }
  }, [initialQ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    runSearch(query);
  };

  const totalMatches = results
    ? (results.subjects?.length || 0) +
      (results.topics?.length || 0) +
      (results.notes?.length || 0) +
      (results.quizzes?.length || 0) +
      (results.documents?.length || 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-slate-900">Global Workspace Search</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search across all subjects, topics, AI notes, quizzes, and uploaded RAG documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for B+ Trees, Deadlock, React Hooks, Java Streams..."
          className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
      </form>

      {loading && <SkeletonCard />}

      {results && !loading && totalMatches === 0 && (
        <EmptyState
          icon={Search}
          title={`No matches found for "${initialQ || query}"`}
          description="Try searching for a broader computer science keyword such as Trees, SQL, Threads, or HTTP."
        />
      )}

      {results && !loading && totalMatches > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900">
              Subjects &amp; Topics ({(results.subjects?.length || 0) + (results.topics?.length || 0)})
            </h2>
            {(results.subjects || []).map((s: any) => (
              <Link
                key={s._id}
                to={`/subjects/${s._id}`}
                className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 text-xs"
              >
                <span className="font-bold text-slate-900">{s.name}</span>
                <span className="text-slate-500 block mt-0.5">{s.description}</span>
              </Link>
            ))}
            {(results.topics || []).map((t: any) => (
              <Link
                key={t._id}
                to={`/topics/${t._id}`}
                className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 text-xs"
              >
                <span className="font-bold text-slate-900">{t.name}</span>
                <span className="text-indigo-600 block mt-0.5">{t.subject}</span>
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900">
              Notes, Quizzes &amp; Documents (
              {(results.notes?.length || 0) +
                (results.quizzes?.length || 0) +
                (results.documents?.length || 0)}
              )
            </h2>
            {(results.notes || []).map((n: any) => (
              <Link
                key={n._id}
                to={`/notes/${n._id}`}
                className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 text-xs"
              >
                <span className="font-bold text-slate-900">[Note] {n.title}</span>
                <span className="text-slate-500 block mt-0.5">{n.subject}</span>
              </Link>
            ))}
            {(results.quizzes || []).map((q: any) => (
              <Link
                key={q._id}
                to={`/quiz/${q._id}`}
                className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 text-xs"
              >
                <span className="font-bold text-slate-900">[Quiz] {q.title}</span>
                <span className="text-slate-500 block mt-0.5">{q.subject}</span>
              </Link>
            ))}
            {(results.documents || []).map((d: any) => (
              <Link
                key={d._id}
                to={`/documents/${d._id}`}
                className="block p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 text-xs"
              >
                <span className="font-bold text-slate-900">[Document] {d.originalName}</span>
                <span className="text-slate-500 block mt-0.5">{d.subject}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
