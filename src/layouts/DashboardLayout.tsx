import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  FileText,
  HelpCircle,
  FolderKanban,
  Calendar,
  CheckSquare,
  BarChart3,
  Compass,
  History,
  Search,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  Layers,
  Menu,
  X,
  Timer,
  Flame,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudySessionModal } from '../components/StudySessionModal';
import { PageTransition } from '../components/ui/MotionAndStates';

interface NavGroup {
  groupLabel: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.FC<{ className?: string }>;
  }>;
}

const studentNavGroups: NavGroup[] = [
  {
    groupLabel: 'Overview & Curriculum',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Subjects', path: '/subjects', icon: BookOpen },
    ],
  },
  {
    groupLabel: 'AI Learning Studio',
    items: [
      { label: 'AI Tutor', path: '/ai-tutor', icon: Bot },
      { label: 'AI Notes', path: '/notes', icon: FileText },
      { label: 'Flashcards', path: '/flashcards', icon: Layers },
      { label: 'Quizzes', path: '/quiz', icon: HelpCircle },
      { label: 'Documents (RAG)', path: '/documents', icon: FolderKanban },
    ],
  },
  {
    groupLabel: 'Planning & Mastery',
    items: [
      { label: 'Study Planner', path: '/study-plans', icon: Calendar },
      { label: 'Study Tasks', path: '/tasks', icon: CheckSquare },
      { label: 'Progress', path: '/progress', icon: BarChart3 },
      { label: 'Recommendations', path: '/recommendations', icon: Compass },
      { label: 'History', path: '/history', icon: History },
      { label: 'Global Search', path: '/search', icon: Search },
    ],
  },
];

const adminNavGroups: NavGroup[] = [
  {
    groupLabel: 'Platform Administration',
    items: [
      { label: 'Admin Console', path: '/admin', icon: ShieldCheck },
      { label: 'Manage Users', path: '/admin/users', icon: Users },
      { label: 'Manage Subjects', path: '/admin/subjects', icon: BookOpen },
      { label: 'Manage Topics', path: '/admin/topics', icon: Layers },
      { label: 'Manage Documents', path: '/admin/documents', icon: FolderKanban },
    ],
  },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Format current section name for top breadcrumb
  const currentSectionLabel = (() => {
    const allItems = [
      ...studentNavGroups.flatMap((g) => g.items),
      ...adminNavGroups.flatMap((g) => g.items),
      { label: 'Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' },
    ];
    const matched = allItems.find((item) => isActive(item.path));
    return matched ? matched.label : 'Workspace';
  })();

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-300 select-none border-r border-slate-800/80">
        {/* Brand Header */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          } h-16 border-b border-slate-800/80 shrink-0`}
        >
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 text-white group focus-visible:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <span className="font-display text-base font-semibold tracking-tight whitespace-nowrap">
                Learning Companion
              </span>
            )}
          </Link>

          {!isMobile && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors hidden lg:inline-flex"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {studentNavGroups.map((group) => (
            <div key={group.groupLabel}>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[11px] font-medium text-slate-500">
                  {group.groupLabel}
                </div>
              )}
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={`relative flex items-center ${
                        isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                      } py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                        active
                          ? 'bg-indigo-600/15 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-500"
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                          active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          {user?.role === 'admin' &&
            adminNavGroups.map((group) => (
              <div key={group.groupLabel}>
                {!isCollapsed && (
                  <div className="px-3 mb-1.5 text-[11px] font-medium text-indigo-400">
                    {group.groupLabel}
                  </div>
                )}
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={isCollapsed ? item.label : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={`relative flex items-center ${
                          isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                        } py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                          active
                            ? 'bg-indigo-600/20 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                        }`}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-sky-400"
                          />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
        </div>

        {/* Account Footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-1 shrink-0">
          <Link
            to="/settings"
            title={isCollapsed ? 'Account Settings' : undefined}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            } py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive('/settings')
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            } py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] lumina-mesh-bg text-slate-900">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 transition-all duration-200 ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs flex-1 flex flex-col z-10">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Top Bar Contract */}
        <header className="sticky top-0 z-20 h-15 lumina-glass border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 mr-2 shrink-0">
              <span>Workspace</span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-slate-900">{currentSectionLabel}</span>
            </div>

            <form onSubmit={handleQuickSearch} className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search subjects, notes, quizzes, or documents..."
                aria-label="Global workspace search"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/90 border border-transparent rounded-lg focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Unboxed streak & study time telemetry */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{user?.streakDays || 1}d streak</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>{Math.round(((user?.totalStudyMinutes || 0) / 60) * 10) / 10}h studied</span>
            </div>

            <button
              onClick={() => setSessionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-xs hover:shadow-indigo-500/20 whitespace-nowrap active:scale-[0.98]"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Focus Timer</span>
            </button>

            <Link
              to="/profile"
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-85 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{user?.role}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Viewport with Route Transition */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto pb-20 lg:pb-10">
          <PageTransition key={location.pathname}>{children}</PageTransition>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar (under 15% mobile viewport cap) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 flex items-center justify-around"
      >
        {[
          { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Subjects', path: '/subjects', icon: BookOpen },
          { label: 'AI Tutor', path: '/ai-tutor', icon: Bot },
          { label: 'Planner', path: '/study-plans', icon: Calendar },
          { label: 'Progress', path: '/progress', icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                active ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <StudySessionModal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        onSessionLogged={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
