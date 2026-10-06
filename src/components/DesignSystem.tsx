import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Code2,
  GitBranch,
  Database,
  Cpu,
  Globe,
  Layout,
  Layers,
  Sparkles,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';

// ============================================================================
// 1. REUSABLE MOTION SYSTEM (Respects prefers-reduced-motion)
// ============================================================================

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 0.35, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const SlideUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 0.42, y = 16, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 0.4, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReduced]);

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-[0.99]'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.12)] hover:border-indigo-200/80 hover:-translate-y-0.5 transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const FloatingCard: React.FC<{
  children: React.ReactNode;
  delayed?: boolean;
  className?: string;
}> = ({ children, delayed = false, className = '' }) => (
  <div className={`${delayed ? 'animate-float-delayed' : 'animate-float-slow'} ${className}`}>
    {children}
  </div>
);

// ============================================================================
// 2. SKELETON LOADING SYSTEM
// ============================================================================

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`lumina-skeleton rounded-lg ${className}`} aria-hidden="true" />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2.5 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, idx) => (
      <Skeleton
        key={idx}
        className={`h-3.5 ${idx === lines - 1 ? 'w-2/3' : idx % 2 === 0 ? 'w-full' : 'w-11/12'}`}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs ${className}`}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-16 h-4 rounded-md" />
    </div>
    <Skeleton className="h-5 w-3/4 rounded-md" />
    <SkeletonText lines={2} />
    <div className="pt-2">
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-xs ${className}`}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
    <div className="h-56 flex items-end gap-3 pt-6 px-2">
      {[48, 72, 58, 88, 64, 92, 76, 84].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <div className="w-full lumina-skeleton rounded-t-lg" style={{ height: `${h}%` }} />
          <Skeleton className="h-2.5 w-8" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs" aria-hidden="true">
    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-48 rounded-lg" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 max-w-xs">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonPage: React.FC = () => (
  <div className="space-y-6 animate-fadeIn" role="status" aria-label="Loading workspace content">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonChart className="lg:col-span-2" />
      <SkeletonCard />
    </div>
  </div>
);

// ============================================================================
// 3. POLISHED EMPTY & ERROR STATES
// ============================================================================

export const EmptyState: React.FC<{
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}> = ({
  icon: Icon = BookOpen,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/90 p-10 sm:p-12 text-center max-w-xl mx-auto my-4 shadow-xs">
    <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-sky-500/10 to-violet-500/15 rotate-6" />
      <div className="relative w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <h3 className="text-lg font-display font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6">{description}</p>
    {(actionLabel || secondaryLabel) && (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all whitespace-nowrap"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {secondaryLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors whitespace-nowrap"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Unable to load workspace data', message, onRetry }) => (
  <div
    role="alert"
    className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-4 shadow-xs"
  >
    <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
    <p className="text-sm text-slate-600 mb-5 leading-relaxed">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all whitespace-nowrap"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    )}
  </div>
);

// ============================================================================
// 4. SUBJECT VISUAL IDENTITY SYSTEM (Unique Icon + Palette per CS Subject)
// ============================================================================

export interface SubjectVisualTheme {
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  barColor: string;
  gradientFrom: string;
  domainCode: string;
}

export function getSubjectVisual(name = '', category = ''): SubjectVisualTheme {
  const lower = `${name} ${category}`.toLowerCase();

  if (lower.includes('java') || lower.includes('object-oriented')) {
    return {
      icon: Code2,
      accentBg: 'bg-indigo-50',
      accentText: 'text-indigo-600',
      accentBorder: 'border-indigo-200/80',
      barColor: 'bg-indigo-600',
      gradientFrom: 'from-indigo-500/10 to-transparent',
      domainCode: 'CS-101',
    };
  }
  if (lower.includes('data structure') || lower.includes('algorithm') || lower.includes('dsa')) {
    return {
      icon: GitBranch,
      accentBg: 'bg-violet-50',
      accentText: 'text-violet-600',
      accentBorder: 'border-violet-200/80',
      barColor: 'bg-violet-600',
      gradientFrom: 'from-violet-500/10 to-transparent',
      domainCode: 'CS-201',
    };
  }
  if (lower.includes('database') || lower.includes('dbms') || lower.includes('sql')) {
    return {
      icon: Database,
      accentBg: 'bg-sky-50',
      accentText: 'text-sky-600',
      accentBorder: 'border-sky-200/80',
      barColor: 'bg-sky-600',
      gradientFrom: 'from-sky-500/10 to-transparent',
      domainCode: 'CS-204',
    };
  }
  if (lower.includes('operating system') || lower.includes('os') || lower.includes('kernel')) {
    return {
      icon: Cpu,
      accentBg: 'bg-emerald-50',
      accentText: 'text-emerald-600',
      accentBorder: 'border-emerald-200/80',
      barColor: 'bg-emerald-600',
      gradientFrom: 'from-emerald-500/10 to-transparent',
      domainCode: 'CS-301',
    };
  }
  if (lower.includes('network') || lower.includes('tcp') || lower.includes('protocol')) {
    return {
      icon: Globe,
      accentBg: 'bg-blue-50',
      accentText: 'text-blue-600',
      accentBorder: 'border-blue-200/80',
      barColor: 'bg-blue-600',
      gradientFrom: 'from-blue-500/10 to-transparent',
      domainCode: 'CS-305',
    };
  }
  if (lower.includes('web') || lower.includes('frontend') || lower.includes('react')) {
    return {
      icon: Layout,
      accentBg: 'bg-cyan-50',
      accentText: 'text-cyan-700',
      accentBorder: 'border-cyan-200/80',
      barColor: 'bg-cyan-600',
      gradientFrom: 'from-cyan-500/10 to-transparent',
      domainCode: 'CS-310',
    };
  }
  if (lower.includes('software engineering') || lower.includes('architecture') || lower.includes('agile')) {
    return {
      icon: Layers,
      accentBg: 'bg-amber-50',
      accentText: 'text-amber-700',
      accentBorder: 'border-amber-200/80',
      barColor: 'bg-amber-600',
      gradientFrom: 'from-amber-500/10 to-transparent',
      domainCode: 'CS-320',
    };
  }
  if (lower.includes('artificial intelligence') || lower.includes('ai') || lower.includes('machine learning')) {
    return {
      icon: Sparkles,
      accentBg: 'bg-purple-50',
      accentText: 'text-purple-600',
      accentBorder: 'border-purple-200/80',
      barColor: 'bg-purple-600',
      gradientFrom: 'from-purple-500/10 to-transparent',
      domainCode: 'CS-401',
    };
  }

  return {
    icon: BookOpen,
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-600',
    accentBorder: 'border-indigo-200/80',
    barColor: 'bg-indigo-600',
    gradientFrom: 'from-indigo-500/10 to-transparent',
    domainCode: 'CS-CORE',
  };
}
