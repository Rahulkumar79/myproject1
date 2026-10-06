import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Plus,
  Sparkles,
  Search,
  BookOpen,
  RotateCw,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  HelpCircle,
  Trash2,
  Edit3,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  FileText,
  FolderKanban,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
  Shuffle,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { flashcardsApi, FlashcardDeck, Flashcard } from '../api/flashcards';
import { subjectsApi } from '../api/subjects';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import {
  AnimatedCard,
  AnimatedButton,
  SkeletonPage,
  SkeletonCard,
  EmptyState,
  getSubjectVisual,
} from '../components/ui/MotionAndStates';

// ============================================================================
// 1. FLASHCARDS OVERVIEW PAGE (Deck Listing & Today's Review Hub)
// ============================================================================
export const FlashcardsPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'All');
  const [selectedSource, setSelectedSource] = useState(searchParams.get('source') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recentlyStudied');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  // Manual Form
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualSubject, setManualSubject] = useState('Data Structures & Algorithms');
  const [manualTopic, setManualTopic] = useState('');

  // AI Form
  const [aiSubject, setAiSubject] = useState('Data Structures & Algorithms');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [decksRes, subjectsRes, summaryRes] = await Promise.all([
        flashcardsApi.getDecks({
          q: searchQuery,
          subject: selectedSubject !== 'All' ? selectedSubject : undefined,
          sourceType: selectedSource !== 'All' ? selectedSource : undefined,
          sortBy,
        }),
        subjectsApi.getAll(),
        flashcardsApi.getSummary(),
      ]);
      setDecks(decksRes.decks || []);
      setSubjects(subjectsRes.subjects || []);
      setSummary(summaryRes.summary || null);
    } catch {
      showToast('Failed to load flashcard decks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSubject, selectedSource, sortBy, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      showToast('Please enter a deck title.', 'error');
      return;
    }
    try {
      const res = await flashcardsApi.createDeck({
        title: manualTitle.trim(),
        description: manualDesc.trim(),
        subject: manualSubject,
        topic: manualTopic.trim(),
        sourceType: 'manual',
      });
      showToast('Flashcard deck created!', 'success');
      setCreateModalOpen(false);
      setManualTitle('');
      setManualDesc('');
      setManualTopic('');
      navigate(`/flashcards/${res.deck._id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create deck.', 'error');
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await flashcardsApi.generateFlashcards({
        subject: aiSubject,
        topic: aiTopic.trim() || undefined,
        difficulty: aiDifficulty,
        count: Number(aiCount),
        saveDeck: true,
      });
      showToast(`Generated ${res.deck.cardCount} active recall flashcards!`, 'success');
      setCreateModalOpen(false);
      navigate(`/flashcards/${res.deck._id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate flashcards.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const totalDueToday = summary?.dueTodayCount || 0;

  return (
    <div className="space-y-7">
      {/* Top Banner / Summary */}
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
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
              <Layers className="w-4 h-4" />
              <span>Spaced Repetition &amp; Active Recall Engine</span>
            </div>
            <h1 className="type-h1 text-white">Interactive Flashcards</h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Master algorithms, definitions, and system trade-offs using deterministic SM-2 spaced
              repetition and grounded AI card synthesis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setActiveTab('ai');
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-sm whitespace-nowrap active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Generate Cards</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('manual');
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span>New Deck</span>
            </button>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono tabular-nums">
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Total Decks</span>
            <span className="font-semibold text-white text-base mt-0.5 block">
              {summary?.totalDecks || 0} Decks
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Total Cards</span>
            <span className="font-semibold text-sky-400 text-base mt-0.5 block">
              {summary?.totalCards || 0} Cards
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Due for Review Today</span>
            <span className="font-semibold text-amber-400 text-base mt-0.5 block">
              {totalDueToday} Due
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Cards Mastered</span>
            <span className="font-semibold text-emerald-400 text-base mt-0.5 block">
              {summary?.masteredCount || 0} ({summary?.masteryPercentage || 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Action Banner if Cards Due Today */}
      {totalDueToday > 0 && summary?.recentDeck && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                You have {totalDueToday} card{totalDueToday > 1 ? 's' : ''} ready for review today!
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Strengthen memory pathways by reviewing cards before they fade from active recall.
              </p>
            </div>
          </div>
          <Link
            to={`/flashcards/${summary.recentDeck._id}/study?mode=due`}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition-colors shrink-0 shadow-xs"
          >
            <span>Start Review Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks by title, topic, or keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="All">All Sources</option>
            <option value="ai">AI Generated</option>
            <option value="manual">Manual Decks</option>
            <option value="note">From Notes</option>
            <option value="document">From Documents</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
          >
            <option value="recentlyStudied">Recently Studied</option>
            <option value="due">Most Cards Due</option>
            <option value="cards">Most Cards</option>
            <option value="newest">Newest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Decks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : decks.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No flashcard decks found"
          description="Create your first study deck manually or use our AI Generator to synthesize high-yield recall cards from any CS subject."
        >
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                setActiveTab('ai');
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
            >
              Generate Cards with AI
            </button>
            <button
              onClick={() => {
                setActiveTab('manual');
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"
            >
              Create Deck Manually
            </button>
          </div>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {decks.map((deck) => {
            const visual = getSubjectVisual(deck.subject);
            const Icon = visual.icon;
            const pct = deck.cardCount > 0 ? Math.round((deck.masteredCount / deck.cardCount) * 100) : 0;

            return (
              <AnimatedCard
                key={deck._id}
                className="p-5 flex flex-col justify-between hover:border-indigo-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${visual.accentBg} ${visual.accentText} border ${visual.accentBorder} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {deck.dueCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200/80">
                          {deck.dueCount} DUE
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 capitalize">
                        {deck.sourceType === 'ai'
                          ? 'AI'
                          : deck.sourceType === 'document'
                          ? 'Doc RAG'
                          : deck.sourceType === 'note'
                          ? 'Notes'
                          : 'Manual'}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/flashcards/${deck._id}`}
                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors block mb-1 truncate"
                  >
                    {deck.title}
                  </Link>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {deck.description || `${deck.subject} · ${deck.topic || 'Core Curriculum'}`}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-1">
                      <span>{pct}% Mastered</span>
                      <span>
                        {deck.masteredCount}/{deck.cardCount} Cards
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      to={`/flashcards/${deck._id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      View Cards
                    </Link>
                    <Link
                      to={`/flashcards/${deck._id}/study`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                    >
                      <span>Study Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}

      {/* CREATE DECK MODAL */}
      {createModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">New Flashcard Deck</h3>
                  <p className="text-xs text-slate-500">Synthesize active recall cards for study</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ai' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Generator</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'manual' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Creation</span>
              </button>
            </div>

            {activeTab === 'ai' ? (
              <form onSubmit={handleGenerateAI} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {subjects.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., B-Trees, TCP Handshake, Normalization, Semaphore"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Interview">Technical Interview</option>
                      <option value="Exam Preparation">Exam Preparation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Number of Cards
                    </label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                    >
                      <option value={5}>5 Cards</option>
                      <option value={10}>10 Cards</option>
                      <option value={15}>15 Cards</option>
                      <option value={20}>20 Cards</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generating ? 'Synthesizing Flashcards...' : 'Generate Deck'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateManual} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deck Title</label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Operating Systems System Calls & Interrupts"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {subjects.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    placeholder="e.g., Kernel Mode, Trap handlers"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    placeholder="Brief description of this deck's scope..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
                  >
                    Create Deck
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. DECK DETAIL & MANAGEMENT PAGE
// ============================================================================
export const DeckDetailPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCard, setSearchCard] = useState('');

  // Modals
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const [deleteDeckConfirm, setDeleteDeckConfirm] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [resetProgressConfirm, setResetProgressConfirm] = useState(false);
  const [aiGenerateModalOpen, setAiGenerateModalOpen] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiDiff, setAiDiff] = useState('Intermediate');
  const [generating, setGenerating] = useState(false);

  const loadDeck = useCallback(async () => {
    if (!deckId) return;
    try {
      setLoading(true);
      const res = await flashcardsApi.getDeckById(deckId);
      setDeck(res.deck);
      setCards(res.cards || []);
    } catch {
      showToast('Deck not found.', 'error');
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  }, [deckId, showToast, navigate]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckId || !front.trim() || !back.trim()) {
      showToast('Front and Back text are required.', 'error');
      return;
    }
    try {
      if (editingCard) {
        await flashcardsApi.updateCard(editingCard._id, {
          front: front.trim(),
          back: back.trim(),
          hint: hint.trim(),
          explanation: explanation.trim(),
          difficulty,
        });
        showToast('Card updated!', 'success');
      } else {
        await flashcardsApi.addCard(deckId, {
          front: front.trim(),
          back: back.trim(),
          hint: hint.trim(),
          explanation: explanation.trim(),
          difficulty,
        });
        showToast('Card added to deck!', 'success');
      }
      setCardModalOpen(false);
      setEditingCard(null);
      setFront('');
      setBack('');
      setHint('');
      setExplanation('');
      loadDeck();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save card.', 'error');
    }
  };

  const handleDeleteCard = async () => {
    if (!deleteCardId) return;
    try {
      await flashcardsApi.deleteCard(deleteCardId);
      showToast('Flashcard deleted.', 'info');
      setDeleteCardId(null);
      loadDeck();
    } catch {
      showToast('Failed to delete card.', 'error');
    }
  };

  const handleDeleteDeck = async () => {
    if (!deckId) return;
    try {
      await flashcardsApi.deleteDeck(deckId);
      showToast('Deck and cards deleted.', 'info');
      navigate('/flashcards');
    } catch {
      showToast('Failed to delete deck.', 'error');
    }
  };

  const handleResetProgress = async () => {
    if (!deckId) return;
    try {
      await flashcardsApi.resetDeck(deckId);
      showToast('Deck study progress reset!', 'success');
      setResetProgressConfirm(false);
      loadDeck();
    } catch {
      showToast('Failed to reset progress.', 'error');
    }
  };

  const handleAiAddCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck) return;
    setGenerating(true);
    try {
      const res = await flashcardsApi.generateFlashcards({
        subject: deck.subject,
        topic: deck.topic,
        difficulty: aiDiff,
        count: aiCount,
        saveDeck: false,
      });

      if (res.cards?.length > 0) {
        for (const c of res.cards) {
          await flashcardsApi.addCard(deck._id, {
            front: c.front,
            back: c.back,
            hint: c.hint,
            explanation: c.explanation,
            difficulty: c.difficulty,
          });
        }
        showToast(`Added ${res.cards.length} AI cards to this deck!`, 'success');
        setAiGenerateModalOpen(false);
        loadDeck();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate additional cards.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !deck) {
    return <SkeletonPage />;
  }

  const visual = getSubjectVisual(deck.subject);
  const Icon = visual.icon;

  const filteredCards = cards.filter(
    (c) =>
      c.front.toLowerCase().includes(searchCard.toLowerCase()) ||
      c.back.toLowerCase().includes(searchCard.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/flashcards"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Decks</span>
      </Link>

      {/* Hero Deck Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl ${visual.accentBg} ${visual.accentText} border ${visual.accentBorder} flex items-center justify-center shrink-0 shadow-2xs`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-600">{deck.subject}</span>
                {deck.topic && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-600 font-medium">{deck.topic}</span>
                  </>
                )}
                <span className="text-slate-300">·</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 capitalize">
                  {deck.sourceType}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{deck.title}</h1>
              {deck.description && (
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  {deck.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/flashcards/${deck._id}/study`}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>Study Deck ({cards.length})</span>
            </Link>
            <button
              onClick={() => {
                setEditingCard(null);
                setFront('');
                setBack('');
                setHint('');
                setExplanation('');
                setDifficulty('Medium');
                setCardModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
            <button
              onClick={() => setAiGenerateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Add More</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100 text-xs font-mono tabular-nums">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[11px] font-sans">Total Cards</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">{cards.length}</span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
            <span className="text-amber-700 block text-[11px] font-sans">Due for Review</span>
            <span className="text-base font-bold text-amber-900 mt-0.5 block">{deck.dueCount || 0}</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
            <span className="text-emerald-700 block text-[11px] font-sans">Mastered</span>
            <span className="text-base font-bold text-emerald-900 mt-0.5 block">{deck.masteredCount || 0}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[11px] font-sans">Accuracy</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">{deck.accuracy || 0}%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[11px] font-sans">Last Studied</span>
            <span className="text-xs font-semibold text-slate-700 mt-1 block truncate">
              {deck.lastStudiedAt ? new Date(deck.lastStudiedAt).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Cards List Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Cards in this Deck</h2>
            <p className="text-xs text-slate-500">Edit, inspect difficulty, or review individual card status</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchCard}
              onChange={(e) => setSearchCard(e.target.value)}
              placeholder="Search cards..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              onClick={() => setResetProgressConfirm(true)}
              title="Reset progress of all cards back to start"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setDeleteDeckConfirm(true)}
              title="Delete this entire deck"
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
            <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">No cards match your search</p>
            <button
              onClick={() => {
                setEditingCard(null);
                setCardModalOpen(true);
              }}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
            >
              Add First Card
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCards.map((c, idx) => (
              <div
                key={c._id}
                className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">#{idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700'
                          : c.difficulty === 'Hard'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.difficulty}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        c.status === 'mastered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'review'
                          ? 'bg-sky-100 text-sky-800'
                          : c.status === 'learning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.sourcePage && (
                      <span className="text-[10px] font-mono text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                        [Page {c.sourcePage}]
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-900 leading-snug">{c.front}</p>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    {c.back}
                  </p>
                  {(c.hint || c.explanation) && (
                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-0.5">
                      {c.hint && <p>💡 Hint: {c.hint}</p>}
                      {c.explanation && <p>ℹ️ {c.explanation}</p>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:pt-1">
                  <div className="text-right text-[11px] font-mono text-slate-400 tabular-nums pr-2 hidden sm:block">
                    <div>Rev: {c.reviewCount}</div>
                    <div>Int: {c.interval}d</div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCard(c);
                      setFront(c.front);
                      setBack(c.back);
                      setHint(c.hint || '');
                      setExplanation(c.explanation || '');
                      setDifficulty(c.difficulty);
                      setCardModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteCardId(c._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT CARD MODAL */}
      {cardModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingCard ? 'Edit Flashcard' : 'Add Flashcard to Deck'}
              </h3>
              <button
                onClick={() => setCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Front (Question / Concept Prompt)
                </label>
                <textarea
                  required
                  rows={3}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="e.g., What is the time complexity of QuickSort in the average case?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Back (Authoritative Answer / Definition)
                </label>
                <textarea
                  required
                  rows={4}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="e.g., O(n log n). QuickSort partitions the array around a pivot..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Optional Hint
                  </label>
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="e.g., Recall the master theorem"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Explanation
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Context, formula proof, or key architectural trade-offs..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
                >
                  {editingCard ? 'Update Card' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI ADD MORE CARDS MODAL */}
      {aiGenerateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl my-auto">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Generate More Cards for {deck.subject}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              AI will generate new active recall cards and automatically append them to this deck.
            </p>

            <form onSubmit={handleAiAddCards} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={aiDiff}
                    onChange={(e) => setAiDiff(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Interview">Interview</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Count</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  >
                    <option value={5}>+ 5 Cards</option>
                    <option value={10}>+ 10 Cards</option>
                    <option value={15}>+ 15 Cards</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAiGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generating ? 'Generating...' : 'Add Cards'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODALS */}
      <ConfirmModal
        open={deleteDeckConfirm}
        title="Delete Flashcard Deck"
        description="Are you sure you want to permanently delete this deck and all of its cards? This action cannot be undone."
        confirmLabel="Delete Deck"
        onConfirm={handleDeleteDeck}
        onCancel={() => setDeleteDeckConfirm(false)}
      />

      <ConfirmModal
        open={Boolean(deleteCardId)}
        title="Delete Flashcard"
        description="Are you sure you want to remove this card from your deck?"
        confirmLabel="Delete Card"
        onConfirm={handleDeleteCard}
        onCancel={() => setDeleteCardId(null)}
      />

      <ConfirmModal
        open={resetProgressConfirm}
        title="Reset Study Progress"
        description="This will reset the spaced repetition review intervals and mastery status of all cards in this deck back to Day 1."
        confirmLabel="Reset Progress"
        onConfirm={handleResetProgress}
        onCancel={() => setResetProgressConfirm(false)}
      />
    </div>
  );
};

// ============================================================================
// 3. FLASHCARD STUDY EXPERIENCE (Smooth 3D Flip & SM-2 Spaced Repetition)
// ============================================================================
export const FlashcardStudyPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // Study state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  const dueOnlyMode = searchParams.get('mode') === 'due';

  const loadCards = useCallback(async () => {
    if (!deckId) return;
    try {
      setLoading(true);
      const res = await flashcardsApi.getDeckById(deckId);
      setDeck(res.deck);

      let studySet: Flashcard[] = res.cards || [];
      if (dueOnlyMode) {
        const now = Date.now();
        const due = studySet.filter((c) => new Date(c.dueAt).getTime() <= now);
        if (due.length > 0) studySet = due;
      }

      setCards(studySet);
    } catch {
      showToast('Failed to load study cards.', 'error');
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  }, [deckId, dueOnlyMode, showToast, navigate]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRateCard = useCallback(
    async (rating: 'again' | 'hard' | 'good' | 'easy') => {
      if (!deckId || !currentCard) return;

      try {
        await flashcardsApi.reviewCard(deckId, {
          cardId: currentCard._id,
          rating,
        });

        setSessionStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

        setIsFlipped(false);
        setShowHint(false);

        if (currentIndex + 1 >= cards.length) {
          setSessionCompleted(true);
        } else {
          setCurrentIndex((idx) => idx + 1);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to record rating.', 'error');
      }
    },
    [deckId, currentCard, currentIndex, cards.length, showToast]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture if focused in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHint((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard('again');
        if (e.key === '2') handleRateCard('hard');
        if (e.key === '3') handleRateCard('good');
        if (e.key === '4') handleRateCard('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, isFlipped, handleRateCard]);

  if (loading || !deck) {
    return <SkeletonPage />;
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">All caught up!</h2>
        <p className="text-xs text-slate-600 mt-1 mb-6">
          There are no cards due for review in this deck right now.
        </p>
        <Link
          to={`/flashcards/${deck._id}`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Deck Details
        </Link>
      </div>
    );
  }

  // Session completion view
  if (sessionCompleted) {
    const totalRated =
      sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    const correctRated = sessionStats.good + sessionStats.easy;
    const accuracy = totalRated > 0 ? Math.round((correctRated / totalRated) * 100) : 0;

    return (
      <div className="max-w-lg mx-auto py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Study Session Complete!</h1>
            <p className="text-xs text-slate-500 mt-1">
              You reviewed {totalRated} cards in {deck.title}. Spaced repetition intervals have been
              updated.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums">
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60">
              <span className="text-rose-700 block text-[10px] font-sans font-bold">Again</span>
              <span className="text-lg font-bold text-rose-900 mt-0.5 block">{sessionStats.again}</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
              <span className="text-amber-700 block text-[10px] font-sans font-bold">Hard</span>
              <span className="text-lg font-bold text-amber-900 mt-0.5 block">{sessionStats.hard}</span>
            </div>
            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200/60">
              <span className="text-sky-700 block text-[10px] font-sans font-bold">Good</span>
              <span className="text-lg font-bold text-sky-900 mt-0.5 block">{sessionStats.good}</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
              <span className="text-emerald-700 block text-[10px] font-sans font-bold">Easy</span>
              <span className="text-lg font-bold text-emerald-900 mt-0.5 block">{sessionStats.easy}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowHint(false);
                setSessionCompleted(false);
                setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
              }}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Study Again
            </button>
            <Link
              to={`/flashcards/${deck._id}`}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Done &amp; View Deck
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Study Header & Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <Link
            to={`/flashcards/${deck._id}`}
            className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Study Session</span>
          </Link>
          <div className="font-mono text-slate-600 tabular-nums">
            Card {currentIndex + 1} of {cards.length} ({progressPct}%)
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 3D INTERACTIVE FLASHCARD CONTAINER */}
      <div
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Click or press Space to flip flashcard"
        className="w-full min-h-[380px] sm:min-h-[420px] cursor-pointer focus:outline-none perspective-1000"
      >
        <div
          className={`w-full min-h-[380px] sm:min-h-[420px] rounded-3xl border transition-all duration-500 transform-style-3d relative shadow-lg ${
            isFlipped
              ? 'bg-slate-950 text-white border-slate-800 rotate-y-180'
              : 'bg-white text-slate-900 border-slate-200/90 hover:border-indigo-300'
          }`}
        >
          {/* FRONT FACE */}
          {!isFlipped ? (
            <div className="p-8 sm:p-10 flex flex-col justify-between h-full min-h-[380px] sm:min-h-[420px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    {deck.subject}
                  </span>
                  {currentCard.difficulty && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {currentCard.difficulty}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400">QUESTION / PROMPT</span>
              </div>

              <div className="my-auto py-6">
                <h3 className="text-lg sm:text-xl font-bold leading-relaxed text-slate-900">
                  {currentCard.front}
                </h3>

                {/* Collapsible Hint */}
                {currentCard.hint && (
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    {showHint ? (
                      <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-800">Hint:</p>
                          <p>{currentCard.hint}</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Show Hint (H)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Press Space or Click to Reveal Answer</span>
                <span className="font-semibold text-indigo-600">Flip Card ↻</span>
              </div>
            </div>
          ) : (
            /* BACK FACE */
            <div className="p-8 sm:p-10 flex flex-col justify-between h-full min-h-[380px] sm:min-h-[420px] rotate-y-180">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Answer Key
                  </span>
                  {currentCard.sourcePage && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-900/50 text-sky-300 border border-sky-700/50">
                      Grounded [Page {currentCard.sourcePage}]
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400">ANSWER / EXPLANATION</span>
              </div>

              <div className="my-auto py-6 space-y-4">
                <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
                  {currentCard.back}
                </p>

                {currentCard.explanation && (
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                    <p className="font-semibold text-indigo-400 mb-0.5">Explanation &amp; Nuance:</p>
                    <p>{currentCard.explanation}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Rate your active recall below:</span>
                <span className="text-slate-400">Click to flip back</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SM-2 SPACED REPETITION RATING CONTROLS (Only visible or prominent when flipped) */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 text-center">
          {isFlipped
            ? 'How well did you recall this concept?'
            : 'Flip card to rate and advance spaced repetition interval'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleRateCard('again')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              isFlipped
                ? 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100 shadow-xs'
                : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            disabled={!isFlipped}
          >
            <div className="font-bold text-xs text-rose-700">Again (1)</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">&lt; 10m · Reset</div>
          </button>

          <button
            type="button"
            onClick={() => handleRateCard('hard')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              isFlipped
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 shadow-xs'
                : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            disabled={!isFlipped}
          >
            <div className="font-bold text-xs text-amber-700">Hard (2)</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">+ 1 Day</div>
          </button>

          <button
            type="button"
            onClick={() => handleRateCard('good')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              isFlipped
                ? 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100 shadow-xs'
                : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            disabled={!isFlipped}
          >
            <div className="font-bold text-xs text-sky-700">Good (3)</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">+ 3-5 Days</div>
          </button>

          <button
            type="button"
            onClick={() => handleRateCard('easy')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              isFlipped
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 shadow-xs'
                : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            disabled={!isFlipped}
          >
            <div className="font-bold text-xs text-emerald-700">Easy (4)</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">+ 7+ Days</div>
          </button>
        </div>
      </div>
    </div>
  );
};
