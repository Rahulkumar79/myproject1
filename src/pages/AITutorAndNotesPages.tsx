import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RotateCcw,
  FileText,
  Search,
  Sparkles,
  BookOpen,
  User as UserIcon,
  Eye,
  Code,
} from 'lucide-react';
import { aiTutorApi } from '../api/aiTutor';
import { notesApi } from '../api/notes';
import { subjectsApi } from '../api/subjects';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  AnimatedCard,
  SkeletonCard,
  EmptyState,
  FadeIn,
  getSubjectVisual,
} from '../components/ui/MotionAndStates';

// 1. AI TUTOR PAGE
export const AITutorPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [mode, setMode] = useState<string>('Intermediate');
  const [subject, setSubject] = useState<string>(
    searchParams.get('subject') || 'Data Structures & Algorithms'
  );
  const [topic, setTopic] = useState<string>(searchParams.get('topic') || '');

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const res = await aiTutorApi.getConversations();
    const list = res.conversations || [];
    setConversations(list);
    if (!conversationId && list.length > 0) {
      navigate(`/ai-tutor/${list[0]._id}`, { replace: true });
    }
  };

  const loadActiveConversation = async (id: string) => {
    try {
      const res = await aiTutorApi.getConversationById(id);
      setActiveConv(res.conversation);
      setMessages(res.messages || []);
      setMode(res.conversation.mode || 'Intermediate');
      if (res.conversation.subject) setSubject(res.conversation.subject);
      if (res.conversation.topic) setTopic(res.conversation.topic);
    } catch {
      navigate('/ai-tutor');
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadActiveConversation(conversationId);
    } else {
      setActiveConv(null);
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNewConversation = async () => {
    try {
      const res = await aiTutorApi.createConversation({
        title: topic ? `${topic} (${mode})` : `${subject} Session`,
        mode,
        subject,
        topic,
      });
      await loadConversations();
      navigate(`/ai-tutor/${res.conversation._id}`);
    } catch {
      showToast('Failed to start conversation.', 'error');
    }
  };

  const submitMessageText = async (msgText: string) => {
    if (!msgText.trim() || sending) return;
    setInput('');
    setSending(true);

    try {
      let targetConvId = conversationId;
      if (!targetConvId) {
        const created = await aiTutorApi.createConversation({
          title: msgText.slice(0, 48),
          mode,
          subject,
          topic,
        });
        targetConvId = created.conversation._id;
        setActiveConv(created.conversation);
        await loadConversations();
        navigate(`/ai-tutor/${targetConvId}`, { replace: true });
      }

      const tempUserMsg = {
        _id: `temp-${Date.now()}`,
        role: 'user',
        content: msgText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const res = await aiTutorApi.sendMessage(targetConvId!, {
        content: msgText,
        mode,
        subject,
        topic,
      });

      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempUserMsg._id),
        res.userMessage,
        res.assistantMessage,
      ]);
      loadConversations();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to get AI Tutor response.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessageText(input);
  };

  const handleModeChange = async (newMode: string) => {
    setMode(newMode);
    if (activeConv) {
      await aiTutorApi.updateConversation(activeConv._id, { mode: newMode });
      showToast(`Switched tutor mode to ${newMode}`, 'info');
    }
  };

  const handleRenameSubmit = async (id: string) => {
    if (!renameTitle.trim()) return;
    await aiTutorApi.updateConversation(id, { title: renameTitle.trim() });
    setRenamingId(null);
    loadConversations();
    if (activeConv?._id === id) {
      setActiveConv({ ...activeConv, title: renameTitle.trim() });
    }
  };

  const handleDeleteConversation = async () => {
    if (!deleteTargetId) return;
    await aiTutorApi.deleteConversation(deleteTargetId);
    showToast('Conversation deleted.', 'info');
    setDeleteTargetId(null);
    const remaining = conversations.filter((c) => c._id !== deleteTargetId);
    setConversations(remaining);
    if (conversationId === deleteTargetId) {
      navigate(remaining[0] ? `/ai-tutor/${remaining[0]._id}` : '/ai-tutor');
    }
  };

  const handleClearMessages = async () => {
    if (!activeConv) return;
    await aiTutorApi.clearMessages(activeConv._id);
    setMessages([]);
    setClearModalOpen(false);
    showToast('Conversation messages cleared.', 'info');
  };

  const promptStarters = [
    `Explain ${topic || subject} from first principles with a concrete example`,
    `Give me 3 technical interview questions on ${topic || subject} with optimal complexity`,
    `What are the most common exam mistakes students make in ${topic || subject}?`,
    `Compare the primary trade-offs and invariants in ${topic || subject}`,
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-5">
      {/* Sidebar: Conversation History */}
      <div className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200/90 flex flex-col shrink-0 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Socratic Sessions</span>
            <span className="text-[11px] text-slate-500">Persistent learning threads</span>
          </div>
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">
              No saved sessions yet. Ask a question to begin!
            </p>
          ) : (
            conversations.map((conv) => {
              const active = conv._id === conversationId;
              return (
                <div
                  key={conv._id}
                  className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all ${
                    active
                      ? 'bg-indigo-50/90 text-indigo-950 font-semibold border border-indigo-200/80'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {renamingId === conv._id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white text-slate-900 rounded border border-indigo-300"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameSubmit(conv._id)}
                        className="text-emerald-600 p-1"
                        aria-label="Save title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="text-slate-400 p-1"
                        aria-label="Cancel rename"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link to={`/ai-tutor/${conv._id}`} className="flex-1 truncate">
                        <div className="truncate">{conv.title}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                          {conv.mode} · {conv.subject || 'CS'}
                        </div>
                      </Link>
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setRenamingId(conv._id);
                            setRenameTitle(conv.title);
                          }}
                          aria-label="Rename conversation"
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(conv._id)}
                          aria-label="Delete conversation"
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Stage */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden shadow-xs">
        {/* Top Mode & Context Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">
                {activeConv?.title || 'Learning Companion Socratic AI Tutor'}
              </h1>
              <p className="text-[11px] text-slate-500">
                {subject} {topic ? `· ${topic}` : ''} · {mode} Mode
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              aria-label="Select pedagogical mode"
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="Beginner">Beginner Mode</option>
              <option value="Intermediate">Intermediate Mode</option>
              <option value="Advanced">Advanced Mode</option>
              <option value="Interview Preparation">Interview Preparation</option>
              <option value="Exam Preparation">Exam Preparation</option>
            </select>

            {activeConv && messages.length > 0 && (
              <button
                onClick={() => setClearModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-8 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-sky-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  Ask anything about {topic || subject}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-md mx-auto">
                  Currently coaching in <strong className="text-slate-800">{mode}</strong> mode. I
                  provide step-by-step derivations, code walkthroughs, and Socratic follow-up
                  probes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                {promptStarters.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => submitMessageText(starter)}
                    className="p-3.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-950 transition-all leading-relaxed"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <FadeIn
                  key={msg._id}
                  duration={0.22}
                  className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-3xl rounded-2xl p-4 sm:p-5 ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-slate-50/95 border border-slate-200/80 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                    </div>
                  )}
                </FadeIn>
              );
            })
          )}

          {/* Animated "Thinking..." Indicator */}
          {sending && (
            <div className="flex items-start gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-bl-xs px-4 py-3.5 flex items-center gap-3">
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">
                  Thinking in {mode} mode...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Modern Composer Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a conceptual question, paste code, or request a step-by-step derivation..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50 whitespace-nowrap active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        title="Delete Conversation"
        description="Are you sure you want to permanently delete this AI Tutor conversation and all of its messages?"
        confirmLabel="Delete Conversation"
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmModal
        open={clearModalOpen}
        title="Clear Conversation Messages"
        description="This will remove all messages in the current thread while keeping the conversation open."
        confirmLabel="Clear Messages"
        onConfirm={handleClearMessages}
        onCancel={() => setClearModalOpen(false)}
      />
    </div>
  );
};

// 2. AI NOTES WORKSPACE PAGE
export const NotesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [subject, setSubject] = useState(
    searchParams.get('subject') || 'Data Structures & Algorithms'
  );
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [length, setLength] = useState('Standard');

  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const [notesRes, subjRes] = await Promise.all([notesApi.getAll(), subjectsApi.getAll()]);
      setNotes(notesRes.notes || []);
      setSubjects(subjRes.subjects || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast('Please enter a specific topic to generate structured notes.', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await notesApi.generate({
        subject,
        topic: topic.trim(),
        difficulty,
        length,
      });
      showToast('Structured 10-section AI notes synthesized!', 'success');
      navigate(`/notes/${res.note._id}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to generate notes.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await notesApi.delete(deleteId);
    showToast('Note deleted.', 'info');
    setDeleteId(null);
    loadNotes();
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || n.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-7">
      <div>
        <h1 className="type-h1 text-slate-900">AI Knowledge &amp; Notes Workspace</h1>
        <p className="text-xs text-slate-500 mt-1">
          Synthesize 10-section academic study notes with formal definitions, examples, pitfalls,
          and high-yield exam questions.
        </p>
      </div>

      {/* Generator Panel */}
      <form
        onSubmit={handleGenerate}
        className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Synthesize New Study Notes</h2>
              <p className="text-[11px] text-slate-500">
                Generates Overview, Definitions, Concepts, Examples, Pitfalls &amp; Exam Questions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Topic Name</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Red-Black Trees, Deadlock Prevention"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Depth &amp; Length</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            >
              <option value="Concise">Concise Summary</option>
              <option value="Standard">Standard Academic</option>
              <option value="Comprehensive">Comprehensive Deep Dive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={generating}
            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? 'Synthesizing Structured Notes...' : 'Generate Structured Notes'}
          </button>
        </div>
      </form>

      {/* Toolbar: Search & Subject Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved notes by title, topic, or subject..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          aria-label="Filter notes by subject"
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="All">All Subjects ({notes.length})</option>
          {subjects.map((s) => (
            <option key={s._id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Saved Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No study notes in this view"
          description="Use the AI Note Synthesizer above to generate a 10-section academic study guide for any computer science topic."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const visual = getSubjectVisual(note.subject);
            const Icon = visual.icon;
            return (
              <AnimatedCard
                key={note._id}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${visual.accentBg} border ${visual.accentBorder} ${visual.accentText} flex items-center justify-center`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span>{note.difficulty}</span>
                      <span> · </span>
                      <span>{note.length}</span>
                    </div>
                  </div>
                  <Link
                    to={`/notes/${note._id}`}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors block mb-1.5"
                  >
                    {note.title}
                  </Link>
                  <p className="text-xs text-indigo-600 font-medium mb-2">{note.subject}</p>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {note.structuredSections?.overview || note.content.slice(0, 180)}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/notes/${note._id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Open Study Guide →
                  </Link>
                  <button
                    onClick={() => setDeleteId(note._id)}
                    aria-label={`Delete ${note.title}`}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Study Note"
        description="Are you sure you want to delete this study note? This action cannot be undone."
        confirmLabel="Delete Note"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// 3. NOTE DETAIL & EDITOR PAGE
export const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [note, setNote] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    notesApi.getById(id).then((res) => {
      setNote(res.note);
      setTitle(res.note.title);
      setContent(res.note.content);
    });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await notesApi.update(id, { title, content });
      setNote(res.note);
      setEditing(false);
      showToast('Note changes saved!', 'success');
    } catch {
      showToast('Failed to save note.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await notesApi.delete(id);
    showToast('Note deleted.', 'info');
    navigate('/notes');
  };

  if (!note) {
    return <SkeletonCard className="max-w-4xl mx-auto my-8" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/notes"
          className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Back to Notes Library
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/quiz/create?subject=${encodeURIComponent(note.subject)}&topic=${encodeURIComponent(note.topic)}`}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Quiz on This Topic
          </Link>
          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-800 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {editing ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            <span>{editing ? 'Reading Preview' : 'Edit Markdown'}</span>
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Note Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Markdown Content
              </label>
              <textarea
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
              <span className="font-semibold text-indigo-600">{note.subject}</span>
              <span>·</span>
              <span>{note.topic}</span>
              <span>·</span>
              <span>{note.difficulty}</span>
              <span>·</span>
              <span>{note.length} Edition</span>
            </div>
            <MarkdownRenderer content={note.content} />
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Study Note"
        description="Are you sure you want to permanently delete this note?"
        confirmLabel="Delete Note"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
};
