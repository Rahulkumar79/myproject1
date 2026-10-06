import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  FileText,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  BookOpen,
  Compass,
  FolderKanban,
  Flame,
  Clock,
  Target,
  AlertCircle,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  FloatingCard,
  AnimatedCard,
  getSubjectVisual,
} from '../components/ui/MotionAndStates';

// 1. LANDING PAGE
export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  const subjectsList = [
    { name: 'Java Programming', modules: '4 Modules · 190m', completion: '78%' },
    { name: 'Data Structures & Algorithms', modules: '4 Modules · 215m', completion: '84%' },
    { name: 'Database Management Systems', modules: '4 Modules · 185m', completion: '91%' },
    { name: 'Operating Systems', modules: '4 Modules · 200m', completion: '65%' },
    { name: 'Computer Networks', modules: '4 Modules · 175m', completion: '72%' },
    { name: 'Web Development', modules: '4 Modules · 185m', completion: '88%' },
    { name: 'Software Engineering', modules: '4 Modules · 160m', completion: '75%' },
    { name: 'Artificial Intelligence & ML', modules: '4 Modules · 220m', completion: '80%' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 lumina-glass border-b border-slate-200/80 px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap"
        >
          Learning Companion
        </Link>

        {/* Zone 2: 4 clean navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
          <a href="#capabilities" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            Capabilities
          </a>
          <a href="#curriculum" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            Curriculum
          </a>
          <a href="#rag-engine" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            Document RAG
          </a>
          <a href="#outcomes" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            Outcomes
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-xs whitespace-nowrap"
            >
              Open Workspace
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-xs hover:shadow-indigo-500/25 whitespace-nowrap"
              >
                Start Learning
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section with Staggered Entrance & Floating AI Command Center Visual */}
      <section className="relative overflow-hidden lumina-hero-mesh border-b border-slate-200/70 pt-14 pb-20 lg:pt-20 lg:pb-28 px-6 lg:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 lumina-grid-pattern opacity-60 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-1/6 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"
        />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Hero Copy (Staggered Entrance Sequence 1 -> 5) */}
          <div className="lg:col-span-6 space-y-6">
            <FadeIn delay={0.05} duration={0.35}>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Personalized AI Learning Assistant · Computer Science Edition</span>
              </div>
            </FadeIn>

            <SlideUp delay={0.12} duration={0.45}>
              <h1 className="type-display text-slate-950">
                Learn Smarter.{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
                  Master Faster.
                </span>
              </h1>
            </SlideUp>

            <SlideUp delay={0.22} duration={0.45}>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Learning Companion combines a Socratic AI tutor, source-cited document RAG, adaptive
                quiz diagnostics, and personalized study planning into one calm, high-focus
                academic command center.
              </p>
            </SlideUp>

            <SlideUp delay={0.32} duration={0.45}>
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-150 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200/90 rounded-xl hover:border-indigo-200 hover:bg-slate-50 transition-all duration-150 whitespace-nowrap"
                >
                  <span>Explore Features</span>
                </a>
              </div>
            </SlideUp>

            <FadeIn delay={0.42} duration={0.45}>
              <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-mono tabular-nums">
                <span>8 Core CS Subjects</span>
                <span aria-hidden="true">·</span>
                <span>32 Structured Modules</span>
                <span aria-hidden="true">·</span>
                <span>Page-Cited RAG Q&amp;A</span>
              </div>
            </FadeIn>
          </div>

          {/* Right Hero Visual: Original Floating AI Learning Command Center (Step 6) */}
          <ScaleIn delay={0.28} className="lg:col-span-6">
            <div className="relative mx-auto max-w-xl lg:max-w-none py-4 px-2 sm:px-6">
              {/* Central AI Learning Command Workspace Card */}
              <div className="relative bg-slate-950 text-white rounded-2xl border border-slate-800 p-6 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.45)] overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-indigo-600/20 blur-2xl pointer-events-none"
                />

                {/* Window Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/90">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Learning Companion AI Command Center</p>
                      <p className="text-[11px] text-slate-400">
                        Active Session · Data Structures &amp; Algorithms
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-300 tabular-nums">
                    Socratic Mode
                  </span>
                </div>

                {/* Socratic Dialogue & Knowledge Path Preview */}
                <div className="space-y-3.5 mb-5">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <p className="text-[11px] text-indigo-400 font-medium mb-1">
                      AI Tutor · Guided Reasoning
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      In a balanced AVL tree of <code className="text-sky-300 font-mono">N</code>{' '}
                      nodes, rotation invariants bound height to{' '}
                      <code className="text-sky-300 font-mono">O(log N)</code>. What happens to the
                      balance factor after inserting into the left-right subtree?
                    </p>
                  </div>

                  {/* Knowledge Graph SVG Visualization */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span>Adaptive Mastery Path</span>
                      <span className="font-mono text-emerald-400 tabular-nums">4 / 5 Mastered</span>
                    </div>
                    <svg className="w-full h-12" viewBox="0 0 400 44" fill="none">
                      <line
                        x1="36"
                        y1="22"
                        x2="364"
                        y2="22"
                        stroke="#334155"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <line x1="36" y1="22" x2="255" y2="22" stroke="#6366F1" strokeWidth="2.5" />
                      {[
                        { x: 36, label: 'Arrays', done: true },
                        { x: 145, label: 'Linked Lists', done: true },
                        { x: 255, label: 'Binary Trees', active: true },
                        { x: 364, label: 'Graph DP', done: false },
                      ].map((node, i) => (
                        <g key={i}>
                          <circle
                            cx={node.x}
                            cy="22"
                            r={node.active ? '9' : '7'}
                            fill={node.done ? '#10B981' : node.active ? '#6366F1' : '#1E293B'}
                            stroke={node.active ? '#A5B4FC' : '#475569'}
                            strokeWidth="2"
                          />
                          <text
                            x={node.x}
                            y="41"
                            textAnchor="middle"
                            fill="#94A3B8"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {node.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Embedded Floating Micro-Cards Grid (The 6 Required Visual Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <FloatingCard className="bg-slate-900/95 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-medium mb-1">
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI Tutor</span>
                    </div>
                    <p className="text-xs font-semibold text-white">5 Teaching Modes</p>
                  </FloatingCard>

                  <FloatingCard delayed className="bg-slate-900/95 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Assessment</span>
                    </div>
                    <p className="text-xs font-semibold text-white font-mono tabular-nums">
                      Quiz Score 92%
                    </p>
                  </FloatingCard>

                  <FloatingCard className="bg-slate-900/95 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-sky-400 text-[11px] font-medium mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Progress</span>
                    </div>
                    <p className="text-xs font-semibold text-white font-mono tabular-nums">
                      Java — 78% Complete
                    </p>
                  </FloatingCard>

                  <FloatingCard delayed className="bg-slate-900/95 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-violet-400 text-[11px] font-medium mb-1">
                      <Target className="w-3.5 h-3.5" />
                      <span>Curriculum</span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">
                      Next Topic: Binary Trees
                    </p>
                  </FloatingCard>

                  <FloatingCard className="bg-slate-900/95 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-medium mb-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Diagnostics</span>
                    </div>
                    <p className="text-xs font-semibold text-white font-mono tabular-nums">
                      3 Weak Topics
                    </p>
                  </FloatingCard>

                  <FloatingCard delayed className="bg-slate-900/95 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-medium mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Daily Schedule</span>
                    </div>
                    <p className="text-xs font-semibold text-white font-mono tabular-nums">
                      Study Plan — 2h 30m
                    </p>
                  </FloatingCard>
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* Section 2: Core Capabilities Bento Grid (Scroll-Reveal) */}
      <section id="capabilities" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <SlideUp viewportOnce className="max-w-2xl mb-12">
          <p className="text-xs font-semibold text-indigo-600 mb-2">
            Integrated Academic Architecture
          </p>
          <h2 className="type-h1 text-slate-900 mb-3">
            Every study workflow unified in a single intelligent workspace.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Move seamlessly from reading structured lecture modules to questioning uploaded textbooks,
            testing mastery with server-graded quizzes, and remediating weak topics.
          </p>
        </SlideUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SlideUp viewportOnce delay={0.05} className="md:col-span-2">
            <AnimatedCard interactive={false} className="p-7 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  01. Socratic AI Tutor &amp; 10-Section Note Synthesis
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Switch dynamically between Beginner, Intermediate, Advanced, Interview Preparation,
                  and Exam Preparation modes. Generate structured university-grade revision notes
                  complete with formal definitions, invariants, common pitfalls, and high-yield exam
                  questions.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 font-mono tabular-nums">
                <span>5 Pedagogical Modes</span>
                <span aria-hidden="true">·</span>
                <span>Markdown &amp; Code Highlighting</span>
                <span aria-hidden="true">·</span>
                <span>Persistent Thread History</span>
              </div>
            </AnimatedCard>
          </SlideUp>

          <SlideUp viewportOnce delay={0.12}>
            <AnimatedCard
              interactive={false}
              id="rag-engine"
              className="p-7 h-full flex flex-col justify-between bg-slate-950 text-white border-slate-800"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  02. Document RAG &amp; Page Citations
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Upload PDF, DOCX, or TXT lecture packets. Documents are chunked, embedded, and
                  searched via hybrid cosine + lexical ranking with strict{' '}
                  <code className="text-sky-300 font-mono text-xs">[Page X]</code> source citations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-sky-400 font-mono">
                Zero hallucination outside uploaded text
              </div>
            </AnimatedCard>
          </SlideUp>

          <SlideUp viewportOnce delay={0.16}>
            <AnimatedCard interactive={false} className="p-7 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  03. Adaptive Quiz &amp; Grading Engine
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Generate timed MCQ, True/False, and Short Answer assessments. Answers remain
                  protected on the server until submission, followed by instant question-by-question
                  diagnostic explanations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Server-side answer key isolation
              </div>
            </AnimatedCard>
          </SlideUp>

          <SlideUp viewportOnce delay={0.22} className="md:col-span-2">
            <AnimatedCard interactive={false} className="p-7 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  04. Weak-Topic Detection, Study Planner &amp; Focus Ring
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Automatically identifies weak topics where quiz accuracy drops below 60% or study
                  completion lags, generating prioritized study plans and daily task schedules
                  within your exact hourly capacity.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 font-mono tabular-nums">
                <span>Circular Focus Timer</span>
                <span aria-hidden="true">·</span>
                <span>Daily Streak Tracking</span>
                <span aria-hidden="true">·</span>
                <span>Targeted Remediation</span>
              </div>
            </AnimatedCard>
          </SlideUp>
        </div>
      </section>

      {/* Section 3: 8-Subject CS Curriculum Grid */}
      <section
        id="curriculum"
        className="py-20 px-6 lg:px-12 bg-white border-y border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto">
          <SlideUp viewportOnce className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-semibold text-indigo-600 mb-2">
                Pre-Seeded University Curriculum
              </p>
              <h2 className="type-h1 text-slate-900">
                8 Core Computer Science Domains · 32 Modules
              </h2>
            </div>
            <Link
              to={user ? '/subjects' : '/register'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              <span>Explore Full Curriculum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </SlideUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectsList.map((subj, idx) => {
              const visual = getSubjectVisual(subj.name);
              const Icon = visual.icon;
              return (
                <SlideUp key={subj.name} viewportOnce delay={idx * 0.04}>
                  <AnimatedCard className="p-5 h-full flex flex-col justify-between">
                    <div>
                      <div
                        className={`w-9 h-9 rounded-xl ${visual.accentBg} border ${visual.accentBorder} ${visual.accentText} flex items-center justify-center mb-3.5`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">{subj.name}</h3>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">{subj.modules}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Interactive Path</span>
                      <span className="font-mono font-semibold text-slate-700 tabular-nums">
                        {subj.completion} avg mastery
                      </span>
                    </div>
                  </AnimatedCard>
                </SlideUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Quantified Proof & Demo Access */}
      <section id="outcomes" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <SlideUp viewportOnce>
          <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-semibold text-indigo-400">
                Instant Evaluation Environment
              </p>
              <h2 className="type-h1 text-white">
                Ready to experience the full student and admin workflow?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Sign in with one click using our pre-seeded Student or Admin demo accounts, or
                register a new student profile to build your own personalized study plan.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors whitespace-nowrap"
                >
                  Launch Demo Workspace
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Create Student Account
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <p className="text-2xl font-bold font-mono tabular-nums text-white">100%</p>
                <p className="text-xs text-slate-400 mt-1">
                  Page-grounded RAG citations on uploaded PDFs &amp; docs
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <p className="text-2xl font-bold font-mono tabular-nums text-indigo-400">32</p>
                <p className="text-xs text-slate-400 mt-1">
                  Pre-seeded CS modules with interactive study paths
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <p className="text-2xl font-bold font-mono tabular-nums text-sky-400">5 Modes</p>
                <p className="text-xs text-slate-400 mt-1">
                  Beginner to Technical Interview Socratic coaching
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400">RBAC</p>
                <p className="text-xs text-slate-400 mt-1">
                  Dedicated Student &amp; Admin analytics consoles
                </p>
              </div>
            </div>
          </div>
        </SlideUp>
      </section>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span className="font-display font-semibold text-slate-900">Learning Companion</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/register" className="hover:text-slate-900 transition-colors">
              Register
            </Link>
          </div>
          <span>© {new Date().getFullYear()} Learning Companion Academic Platform</span>
        </div>
      </footer>
    </div>
  );
};

// 2. LOGIN PAGE
export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('student@lumina.edu');
  const [password, setPassword] = useState('Student@123');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedUser = await login({ email, password });
      showToast(`Welcome back, ${loggedUser.name}!`, 'success');
      navigate(loggedUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Invalid credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'student' | 'admin') => {
    if (role === 'student') {
      setEmail('student@lumina.edu');
      setPassword('Student@123');
    } else {
      setEmail('admin@lumina.edu');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="min-h-screen lumina-hero-mesh flex flex-col justify-center items-center p-6">
      <ScaleIn className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xl">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-lg font-semibold text-slate-900 mb-2"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span>Learning Companion</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Sign in to your workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your personalized AI tutor, notes, quizzes, and study planner.
          </p>
        </div>

        {/* Instant Demo Credential Fillers */}
        <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <p className="text-[11px] font-medium text-slate-500 mb-2">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('student')}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-indigo-400 text-slate-800 transition-colors text-left"
            >
              <div className="font-semibold text-slate-900">Demo Student</div>
              <div className="text-[10px] text-slate-500 font-mono">student@lumina.edu</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-indigo-400 text-slate-800 transition-colors text-left"
            >
              <div className="font-semibold text-slate-900">Demo Admin</div>
              <div className="text-[10px] text-slate-500 font-mono">admin@lumina.edu</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 mt-6">
          New to Learning Companion?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </ScaleIn>
    </div>
  );
};

// 3. REGISTER PAGE
export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate CS');
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([
    'Data Structures & Algorithms',
    'Database Management Systems (DBMS)',
  ]);
  const [submitting, setSubmitting] = useState(false);

  const subjectOptions = [
    'Java Programming',
    'Data Structures & Algorithms',
    'Database Management Systems (DBMS)',
    'Operating Systems',
    'Computer Networks',
    'Web Development',
    'Software Engineering',
    'Artificial Intelligence & Machine Learning',
  ];

  const toggleSubject = (subj: string) => {
    setPreferredSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        educationLevel,
        preferredSubjects,
      });
      showToast('Account created! Welcome to Learning Companion.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Registration failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen lumina-hero-mesh flex flex-col justify-center items-center p-6">
      <ScaleIn className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xl">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-lg font-semibold text-slate-900"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span>Learning Companion</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Create your student profile</h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalize your curriculum, AI tutor level, and initial study goals.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              >
                <option value="High School AP CS">High School AP CS</option>
                <option value="Undergraduate CS">Undergraduate CS</option>
                <option value="Graduate / Masters">Graduate / Masters</option>
                <option value="Self-Taught / Interview Prep">Self-Taught / Interview Prep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Select Focus Subjects
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subjectOptions.map((subj) => {
                const active = preferredSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors truncate ${
                      active
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50"
          >
            {submitting ? 'Creating Workspace...' : 'Create Account & Start Learning'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </ScaleIn>
    </div>
  );
};

// 4. FORGOT PASSWORD PAGE
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen lumina-hero-mesh flex flex-col justify-center items-center p-6">
      <ScaleIn className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-display text-lg font-semibold text-slate-900"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span>Learning Companion</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 mt-3 mb-1">Password Recovery</h1>
        <p className="text-xs text-slate-500 mb-6">
          Enter your registered academic email to receive password reset instructions or use the demo
          accounts on the Sign In page.
        </p>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-3">
            <p className="font-semibold">Recovery instructions generated.</p>
            <p>
              If an account matches <span className="font-mono">{email}</span>, you can reset your
              password from your account settings or sign in with the demo credentials.
            </p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@lumina.edu"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Send Reset Instructions
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-slate-600 hover:text-slate-900 font-medium">
            ← Back to Sign In
          </Link>
        </div>
      </ScaleIn>
    </div>
  );
};
