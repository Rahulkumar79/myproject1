import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, CheckCircle2, X } from 'lucide-react';
import { studySessionsApi } from '../api/studySessions';
import { subjectsApi } from '../api/subjects';
import { useToast } from '../context/ToastContext';

interface StudySessionModalProps {
  open: boolean;
  onClose: () => void;
  onSessionLogged?: () => void;
}

type SessionPreset = {
  id: 'pomodoro-25' | 'deep-50' | 'custom-15';
  label: string;
  targetMinutes: number;
};

const SESSION_PRESETS: SessionPreset[] = [
  { id: 'pomodoro-25', label: '25m Focus Sprint', targetMinutes: 25 },
  { id: 'deep-50', label: '50m Deep Work', targetMinutes: 50 },
  { id: 'custom-15', label: '15m Quick Review', targetMinutes: 15 },
];

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  open,
  onClose,
  onSessionLogged,
}) => {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [topic, setTopic] = useState('');
  const [activityType, setActivityType] = useState('reading');
  const [manualMinutes, setManualMinutes] = useState(30);
  const [notes, setNotes] = useState('');

  // Focus Ring Timer state (preserves exact elapsedSeconds tracking)
  const [preset, setPreset] = useState<SessionPreset>(SESSION_PRESETS[0]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      subjectsApi.getAll().then((res) => {
        if (res.subjects?.length) {
          setSubjects(res.subjects);
          setSubject(res.subjects[0].name);
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  if (!open) return null;

  const targetSeconds = preset.targetMinutes * 60;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const progressRatio = Math.min(1, elapsedSeconds / targetSeconds);

  const formatClock = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // SVG Circular Progress Ring Geometry
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const duration = elapsedSeconds >= 60 ? Math.ceil(elapsedSeconds / 60) : Number(manualMinutes) || 25;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - duration * 60000);

      await studySessionsApi.create({
        subject,
        topic: topic || `${subject} Core Study`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        activityType,
        notes,
      });

      showToast(`Logged ${duration} min study session for ${subject}!`, 'success');
      setRunning(false);
      setElapsedSeconds(0);
      setNotes('');
      onSessionLogged?.();
      onClose();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to log study session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-timer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 id="focus-timer-modal-title" className="text-base font-semibold text-slate-900">
                Focus Timer & Study Logger
              </h3>
              <p className="text-xs text-slate-500">
                Track focused study intervals and maintain your daily learning streak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Focus Timer"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Premium Circular Focus Timer Stage */}
        <div className="bg-slate-950 text-white rounded-2xl p-5 mb-5 border border-slate-800 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-600/20 blur-2xl pointer-events-none"
          />
          {/* Session Type Selector */}
          <div className="flex items-center justify-center gap-1.5 mb-4 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 max-w-xs mx-auto">
            {SESSION_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPreset(p);
                  setManualMinutes(p.targetMinutes);
                }}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                  preset.id === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Circular Progress Ring */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-5">
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="url(#luminaTimerGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <defs>
                  <linearGradient id="luminaTimerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] text-slate-400 font-medium">Remaining</span>
                <span className="text-3xl font-mono font-semibold tracking-tight tabular-nums text-white my-0.5">
                  {formatClock(remainingSeconds)}
                </span>
                <span className="text-[11px] text-indigo-300 font-mono tabular-nums">
                  Elapsed {formatClock(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold text-white">{preset.label}</p>
                <p className="text-[11px] text-slate-400">
                  {running
                    ? 'Focus interval active — stay on task'
                    : elapsedSeconds > 0
                    ? 'Timer paused — resume or log session'
                    : 'Ready to begin focused study block'}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap active:scale-[0.98] ${
                    running
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                  }`}
                >
                  {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{running ? 'Pause' : elapsedSeconds > 0 ? 'Resume' : 'Start Focus'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setElapsedSeconds(0);
                  }}
                  aria-label="Reset timer"
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSession} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-colors"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-colors"
              >
                <option value="reading">Reading & Concept Review</option>
                <option value="practice">Coding / Problem Practice</option>
                <option value="ai-tutor">AI Tutor Deep Dive</option>
                <option value="notes">Note Synthesis</option>
                <option value="quiz">Quiz Preparation</option>
                <option value="document-review">Document Study</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Topic Focus</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., B+ Trees & Indexing"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Manual Duration (mins, if timer &lt; 1m)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={manualMinutes}
                onChange={(e) => setManualMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Key Takeaways / Reflection
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What concepts did you master or find challenging during this session?"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50 whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Complete & Log Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
