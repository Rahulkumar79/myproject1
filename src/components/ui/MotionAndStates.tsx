import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  RefreshCw,
  Code2,
  GitBranch,
  Database,
  Cpu,
  Globe,
  Layout,
  Layers,
  BrainCircuit,
  BookOpen,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';

// ============================================================================
// 1. REUSABLE MOTION SYSTEM (Respects prefers-reduced-motion)
// ============================================================================

export const PageTransition: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
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
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
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
  viewportOnce?: boolean;
  className?: string;
}> = ({ children, delay = 0, duration = 0.42, viewportOnce = false, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const [inView, setInView] = useState(!viewportOnce);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!viewportOnce || prefersReduced) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewportOnce, prefersReduced]);

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FloatingCard: React.FC<{
  children: React.ReactNode;
  delayed?: boolean;
  className?: string;
}> = ({ children, delayed = false, className = '' }) => (
  <div
    className={`${delayed ? 'animate-float-delayed' : 'animate-float'} transition-all duration-200 ${className}`}
  >
    {children}
  </div>
);

export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  id?: string;
}> = ({ children, onClick, className = '', interactive = true, id }) => (
  <div
    id={id}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
    className={`bg-white rounded-xl border border-slate-200/90 transition-all duration-200 ${
      interactive
        ? 'hover:-translate-y-0.5 hover:border-indigo-300/80 hover:shadow-[0_8px_24px_-8px_rgba(79,70,229,0.12)]'
        : ''
    } ${onClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600' : ''} ${className}`}
  >
    {children}
  </div>
);

export const AnimatedButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }
> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-[0_6px_20px_-4px_rgba(79,70,229,0.4)]',
    secondary:
      'bg-white text-slate-800 border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/80 shadow-xs',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  }[variant];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-xs',
    lg: 'px-6 py-3 text-sm',
  }[size];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 active:scale-[0.98] hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ============================================================================
// 2. SKELETON LOADING SYSTEM
// ============================================================================

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => (
  <div
    aria-hidden="true"
    style={style}
    className={`animate-pulse rounded-lg bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 ${className}`}
  />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2.5 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, idx) => (
      <Skeleton
        key={idx}
        className={`h-3.5 ${idx === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 ${className}`}
  >
    <div className="flex items-center justify-between">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="w-16 h-4 rounded" />
    </div>
    <Skeleton className="w-3/4 h-5 rounded" />
    <SkeletonText lines={2} />
    <Skeleton className="w-full h-2 rounded-full" />
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`bg-white rounded-xl border border-slate-200/80 p-6 space-y-5 ${className}`}
  >
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="w-44 h-5" />
        <Skeleton className="w-64 h-3.5" />
      </div>
      <Skeleton className="w-24 h-8 rounded-lg" />
    </div>
    <div className="h-56 flex items-end gap-3 pt-6">
      {[45, 70, 55, 85, 62, 90, 75].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <Skeleton className="w-full rounded-t-md" style={{ height: `${h}%` } as React.CSSProperties} />
          <Skeleton className="w-8 h-3" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => (
  <div
    aria-hidden="true"
    className={`bg-white rounded-xl border border-slate-200/80 overflow-hidden ${className}`}
  >
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <Skeleton className="w-40 h-4" />
      <Skeleton className="w-28 h-8 rounded-lg" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="w-48 h-4" />
              <Skeleton className="w-32 h-3" />
            </div>
          </div>
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-6 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonPage: React.FC<{ title?: string }> = () => (
  <div className="space-y-6" role="status" aria-label="Loading workspace content">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="w-32 h-3.5" />
        <Skeleton className="w-64 h-8" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-32 h-10 rounded-lg" />
        <Skeleton className="w-36 h-10 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonChart className="lg:col-span-2" />
      <SkeletonCard className="h-full" />
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
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}> = ({
  icon: Icon = BookOpen,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  children,
}) => (
  <div
    className={`bg-white rounded-xl border border-slate-200/90 p-10 text-center max-w-xl mx-auto my-4 ${className}`}
  >
    <div className="relative w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-sky-50 to-violet-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-xs">
      <Icon className="w-6 h-6" />
      <span
        aria-hidden="true"
        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"
      />
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
      {description}
    </p>
    {(actionLabel || secondaryActionLabel) && (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <AnimatedButton variant="primary" onClick={onAction}>
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </AnimatedButton>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <AnimatedButton variant="secondary" onClick={onSecondaryAction}>
            <span>{secondaryActionLabel}</span>
          </AnimatedButton>
        )}
      </div>
    )}
    {children}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Unable to load workspace data',
  message,
  onRetry,
  className = '',
}) => (
  <div
    role="alert"
    className={`bg-white rounded-xl border border-rose-200/90 p-8 text-center max-w-lg mx-auto my-6 ${className}`}
  >
    <div className="w-12 h-12 mx-auto mb-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
      <AlertCircle className="w-6 h-6" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-xs text-slate-600 leading-relaxed mb-5">{message}</p>
    {onRetry && (
      <AnimatedButton variant="secondary" onClick={onRetry}>
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </AnimatedButton>
    )}
  </div>
);

// ============================================================================
// 4. SUBJECT VISUAL IDENTITY SYSTEM
// ============================================================================

export interface SubjectVisualIdentity {
  icon: LucideIcon;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  barColor: string;
  gradientFrom: string;
}

export function getSubjectVisual(name = '', category = ''): SubjectVisualIdentity {
  const key = `${name} ${category}`.toLowerCase();

  if (key.includes('java') || key.includes('programming')) {
    return {
      icon: Code2,
      accentText: 'text-indigo-600',
      accentBg: 'bg-indigo-50/90',
      accentBorder: 'border-indigo-200/80',
      barColor: 'bg-indigo-600',
      gradientFrom: 'from-indigo-600 to-blue-600',
    };
  }
  if (key.includes('data structure') || key.includes('algorithm') || key.includes('dsa')) {
    return {
      icon: GitBranch,
      accentText: 'text-violet-600',
      accentBg: 'bg-violet-50/90',
      accentBorder: 'border-violet-200/80',
      barColor: 'bg-violet-600',
      gradientFrom: 'from-violet-600 to-indigo-600',
    };
  }
  if (key.includes('database') || key.includes('dbms') || key.includes('sql')) {
    return {
      icon: Database,
      accentText: 'text-sky-600',
      accentBg: 'bg-sky-50/90',
      accentBorder: 'border-sky-200/80',
      barColor: 'bg-sky-600',
      gradientFrom: 'from-sky-600 to-cyan-600',
    };
  }
  if (key.includes('operating system') || key.includes('os') || key.includes('kernel')) {
    return {
      icon: Cpu,
      accentText: 'text-blue-600',
      accentBg: 'bg-blue-50/90',
      accentBorder: 'border-blue-200/80',
      barColor: 'bg-blue-600',
      gradientFrom: 'from-blue-600 to-indigo-600',
    };
  }
  if (key.includes('network') || key.includes('tcp') || key.includes('protocol')) {
    return {
      icon: Globe,
      accentText: 'text-cyan-700',
      accentBg: 'bg-cyan-50/90',
      accentBorder: 'border-cyan-200/80',
      barColor: 'bg-cyan-600',
      gradientFrom: 'from-cyan-600 to-sky-600',
    };
  }
  if (key.includes('web') || key.includes('frontend') || key.includes('react')) {
    return {
      icon: Layout,
      accentText: 'text-indigo-600',
      accentBg: 'bg-indigo-50/90',
      accentBorder: 'border-indigo-200/80',
      barColor: 'bg-indigo-600',
      gradientFrom: 'from-indigo-600 to-sky-600',
    };
  }
  if (key.includes('software') || key.includes('architecture') || key.includes('engineering')) {
    return {
      icon: Layers,
      accentText: 'text-purple-600',
      accentBg: 'bg-purple-50/90',
      accentBorder: 'border-purple-200/80',
      barColor: 'bg-purple-600',
      gradientFrom: 'from-purple-600 to-indigo-600',
    };
  }
  if (key.includes('artificial intelligence') || key.includes('machine learning') || key.includes('ai')) {
    return {
      icon: BrainCircuit,
      accentText: 'text-violet-600',
      accentBg: 'bg-violet-50/90',
      accentBorder: 'border-violet-200/80',
      barColor: 'bg-violet-600',
      gradientFrom: 'from-violet-600 to-fuchsia-600',
    };
  }

  return {
    icon: BookOpen,
    accentText: 'text-indigo-600',
    accentBg: 'bg-indigo-50/90',
    accentBorder: 'border-indigo-200/80',
    barColor: 'bg-indigo-600',
    gradientFrom: 'from-indigo-600 to-blue-600',
  };
}
