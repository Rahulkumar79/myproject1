import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  BookOpen,
  Layers,
  FolderKanban,
  Trash2,
  Plus,
  Edit3,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../api/admin';
import { subjectsApi } from '../api/subjects';
import { topicsApi } from '../api/topics';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import {
  AnimatedCard,
  SkeletonPage,
  SkeletonTable,
} from '../components/ui/MotionAndStates';

// 1. ADMIN DASHBOARD OVERVIEW PAGE
export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getOverview()
      .then((res) => setData(res.overview))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <SkeletonPage />;
  }

  if (!data) return null;

  const { counts = {}, popularSubjects = [], recentUsers = [], recentActivity = [] } = data;

  return (
    <div className="space-y-8">
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Administration Console</span>
          </div>
          <h1 className="type-h1 text-white">System Overview &amp; Telemetry</h1>
          <p className="text-xs text-slate-300 mt-1">
            Monitor platform adoption, manage student accounts, and curate curriculum subjects and
            topics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/users"
            className="px-3.5 py-2 text-xs font-semibold bg-white/10 text-white border border-white/15 rounded-xl hover:bg-white/15 transition-colors"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/subjects"
            className="px-3.5 py-2 text-xs font-semibold bg-white/10 text-white border border-white/15 rounded-xl hover:bg-white/15 transition-colors"
          >
            Manage Subjects
          </Link>
          <Link
            to="/admin/topics"
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
          >
            Manage Topics
          </Link>
        </div>
      </div>

      {/* Platform KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: counts.totalUsers, accent: 'text-indigo-600' },
          { label: 'Active Students', value: counts.activeUsers, accent: 'text-emerald-600' },
          { label: 'Subjects', value: counts.totalSubjects, accent: 'text-sky-600' },
          { label: 'Topics', value: counts.totalTopics, accent: 'text-violet-600' },
          { label: 'Quizzes Generated', value: counts.totalQuizzes, accent: 'text-slate-900' },
          { label: 'Quiz Attempts', value: counts.totalAttempts, accent: 'text-slate-900' },
          { label: 'AI Notes Synthesized', value: counts.totalNotes, accent: 'text-slate-900' },
          { label: 'RAG Documents', value: counts.totalDocuments, accent: 'text-slate-900' },
        ].map((kpi) => (
          <AnimatedCard key={kpi.label} interactive={false} className="p-5">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${kpi.accent}`}>
              {kpi.value ?? 0}
            </p>
          </AnimatedCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Curriculum Distribution by Subject
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={popularSubjects}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
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
                <Bar
                  dataKey="topicCount"
                  fill="#4F46E5"
                  name="Modules"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recent Platform Activity</h2>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {recentActivity.map((act: any) => (
              <div
                key={act._id}
                className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="font-semibold text-slate-900">{act.title}</p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {act.activityType.replace('_', ' ')} · {act.subject || 'Platform'}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {new Date(act.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Registered Platform Users</h2>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Manage All Users →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Name</th>
                <th className="py-2.5 pr-4 font-semibold">Email</th>
                <th className="py-2.5 pr-4 font-semibold">Role</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 font-semibold text-right">Study Minutes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.map((u: any) => (
                <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 pr-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-2.5 pr-4 capitalize">{u.role}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`font-semibold ${
                        u.isActive !== false ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {u.totalStudyMinutes || 0}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 2. ADMIN USERS MANAGEMENT PAGE
export const AdminUsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleUser = async (u: any) => {
    const nextState = u.isActive === false ? true : false;
    try {
      await adminApi.toggleUserStatus(u._id, nextState);
      showToast(`User ${u.name} ${nextState ? 'enabled' : 'disabled'}.`, 'info');
      loadUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-slate-900">Manage Platform Users</h1>
        <p className="text-xs text-slate-500 mt-1">
          View student accounts, study telemetry, and enable or disable platform access.
        </p>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Education Level</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 capitalize">{u.role}</td>
                  <td className="py-3 px-4 text-slate-600">{u.educationLevel}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        u.isActive !== false ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUser(u)}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                          u.isActive !== false
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive !== false ? 'Disable Account' : 'Enable Account'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// 3. ADMIN SUBJECTS MANAGEMENT PAGE
export const AdminSubjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [description, setDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadSubjects = async () => {
    const res = await subjectsApi.getAll();
    setSubjects(res.subjects || []);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    try {
      await subjectsApi.create({ name, category, difficulty, description });
      showToast('Subject created!', 'success');
      setName('');
      setDescription('');
      loadSubjects();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create subject.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await subjectsApi.delete(deleteId);
    showToast('Subject deleted.', 'info');
    setDeleteId(null);
    loadSubjects();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-slate-900">Manage Curriculum Subjects</h1>
        <p className="text-xs text-slate-500 mt-1">
          Create or remove subjects across the Learning Companion catalog.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-xs"
      >
        <h2 className="text-sm font-bold text-slate-900">Add New Subject</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subject Name (e.g., Distributed Systems)"
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g., Systems)"
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <textarea
          rows={2}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Subject description..."
          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Subject
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs">
        {subjects.map((s) => (
          <div key={s._id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500">
                {s.category} · {s.difficulty} · {s.topicCount || 0} topics
              </p>
            </div>
            <button
              onClick={() => setDeleteId(s._id)}
              aria-label={`Delete ${s.name}`}
              className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Subject"
        description="Deleting this subject will also remove its associated topics."
        confirmLabel="Delete Subject"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// 4. ADMIN TOPICS MANAGEMENT PAGE
export const AdminTopicsPage: React.FC = () => {
  const { showToast } = useToast();
  const [topics, setTopics] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [estimatedStudyTime, setEstimatedStudyTime] = useState(45);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    const [topRes, subjRes] = await Promise.all([topicsApi.getAll(), subjectsApi.getAll()]);
    setTopics(topRes.topics || []);
    setSubjects(subjRes.subjects || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await topicsApi.create({
      subject,
      name,
      description: description || `Core principles and applications of ${name}.`,
      difficulty,
      estimatedStudyTime,
    });
    showToast('Topic created!', 'success');
    setName('');
    setDescription('');
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await topicsApi.delete(deleteId);
    showToast('Topic deleted.', 'info');
    setDeleteId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-slate-900">Manage Learning Topics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Add or remove modular learning topics across subjects.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-xs"
      >
        <h2 className="text-sm font-bold text-slate-900">Add New Topic</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {subjects.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Topic Name"
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input
            type="number"
            min={15}
            max={240}
            value={estimatedStudyTime}
            onChange={(e) => setEstimatedStudyTime(Number(e.target.value))}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
          />
        </div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short topic description..."
          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Topic
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs">
        {topics.map((t) => (
          <div key={t._id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900">{t.name}</p>
              <p className="text-[11px] text-slate-500">
                {t.subject} · {t.difficulty} · {t.estimatedStudyTime} mins
              </p>
            </div>
            <button
              onClick={() => setDeleteId(t._id)}
              aria-label={`Delete ${t.name}`}
              className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Topic"
        description="Are you sure you want to delete this topic?"
        confirmLabel="Delete Topic"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// 5. ADMIN DOCUMENTS MANAGEMENT PAGE
export const AdminDocumentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadDocs = async () => {
    const res = await adminApi.getDocuments();
    setDocuments(res.documents || []);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await adminApi.deleteDocument(deleteId);
    showToast('Document removed by administrator.', 'info');
    setDeleteId(null);
    loadDocs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-slate-900">Manage Uploaded RAG Documents</h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect and moderate documents uploaded across all users.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs">
        {documents.map((d) => (
          <div key={d._id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900">{d.originalName}</p>
              <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                {d.subject} · {d.fileType.toUpperCase()} · {d.pageCount} pages · {d.chunkCount}{' '}
                chunks
              </p>
            </div>
            <button
              onClick={() => setDeleteId(d._id)}
              aria-label={`Delete ${d.originalName}`}
              className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Platform Document"
        description="Are you sure you want to delete this document and its vector chunks?"
        confirmLabel="Delete Document"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
