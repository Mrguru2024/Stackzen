'use client';

import { useState, useEffect, useMemo, type ComponentType, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Button, ScrollArea } from '@/components/ui';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavLinks, type NavLink } from '@/config/nav-links';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { signOut } from 'next-auth/react';
import { isPrivilegedEmail } from '@/lib/auth/privileged-users';

const _categoryLabels = {
  main: 'Main',
  income: 'Income & Services',
  finance: 'Financial Tools',
  tools: 'Additional Tools',
  settings: 'Settings',
} as const;

interface MobileSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
  pathname: string | null;
  NavLinks: NavLink[];
  ThemeToggle: ComponentType;
}

export function MobileSidebar({
  isMobileOpen,
  setIsMobileOpen,
  pathname,
  NavLinks,
  ThemeToggle,
}: MobileSidebarProps) {
  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-[max(0.75rem,env(safe-area-inset-left,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] z-50 border bg-background/95 shadow-sm backdrop-blur-sm md:hidden"
          aria-label="Open menu"
        >
          <Icons.menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="bg-white p-0 text-gray-900 dark:bg-[#1E1E1E] dark:text-gray-100"
      >
        <div className="flex h-full w-full min-w-0 max-w-full flex-col bg-sidebar text-sidebar-foreground">
          <div className="flex h-14 min-w-0 items-center border-b px-4">
            <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
              <Icons.logo className="h-6 w-6 shrink-0" />
              <span className="truncate">StackZen</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-2">
            <div className="px-2 py-2">
              <div className="space-y-1">
                {NavLinks.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground active:opacity-90',
                      pathname === item.href ? 'bg-accent text-accent-foreground' : 'transparent'
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
          {/* Theme Toggle and Logout for Mobile */}
          <div className="flex flex-col gap-2 border-t p-4">
            <ThemeToggle />
            <Button onClick={() => signOut()} className="w-full" variant="outline">
              Log Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface DesktopSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
  pathname: string | null;
  NavLinks: NavLink[];
  _categoryLabels: typeof _categoryLabels;
  cn: typeof cn;
  ThemeToggle: ComponentType;
  _renderNavLinks: (links: NavLink[]) => ReactNode;
  _showDevTools: boolean;
}

export function DesktopSidebar({
  isCollapsed,
  setIsCollapsed,
  pathname,
  NavLinks,
  _categoryLabels,
  cn,
  ThemeToggle,
  _renderNavLinks,
  _showDevTools,
}: DesktopSidebarProps) {
  return (
    <div
      className={cn(
        'hidden h-full max-h-[100dvh] min-h-0 md:flex flex-col border-r border-border bg-white dark:bg-[#1E1E1E] transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-82',
        'py-4 px-2'
      )}
    >
      {/* Sidebar Header */}
      <div className="mb-4 flex items-center justify-between px-2">
        {!isCollapsed && <span className="text-2xl font-bold tracking-tight">StackZen</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <Icons.chevronRight className="h-5 w-5" />
          ) : (
            <Icons.chevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-6">
          {Object.entries(_categoryLabels).map(([category, label]) => {
            const _categoryLinks = NavLinks.filter(link => link.category === category);
            if (_categoryLinks.length === 0) return null;

            return (
              <div key={category} className="mb-2">
                {!isCollapsed && (
                  <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </h4>
                )}
                <div className="flex flex-col gap-1">{_renderNavLinks(_categoryLinks)}</div>
              </div>
            );
          })}
          {/* Dev Tools link for SUPER_ADMIN */}
          {_showDevTools && (
            <div className="mb-2">
              {!isCollapsed && (
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-red-500">
                  Developer
                </h4>
              )}
              <div className="flex flex-col gap-1">
                <Link
                  href="/dev-tools"
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-accent hover:text-accent-foreground',
                    pathname === '/dev-tools' ? 'bg-accent text-accent-foreground' : 'transparent'
                  )}
                >
                  <Icons.settings className="h-4 w-4" />
                  {!isCollapsed && 'Dev Tools'}
                </Link>
              </div>
            </div>
          )}
        </nav>
      </ScrollArea>
      {/* Theme Toggle and Logout for Desktop */}
      <div className="flex flex-col gap-2 border-t p-4">
        <ThemeToggle />
        <Button onClick={() => signOut()} className="w-full" variant="outline">
          Log Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ userTier = 'FREE', session }: { userTier?: string; session?: any }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeNavKeys, setActiveNavKeys] = useState<string[] | null>(null);
  const pathname = usePathname();

  // Load sidebar state from localStorage
  useEffect(() => {
    const _savedState = localStorage.getItem('sidebarCollapsed');
    if (_savedState) {
      setIsCollapsed(JSON.parse(_savedState));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Keyboard shortcut to toggle sidebar
  useEffect(() => {
    const _handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', _handleKeyDown);
    return () => window.removeEventListener('keydown', _handleKeyDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadActivation = async () => {
      try {
        const response = await fetch('/api/income-profiles/activation', { method: 'GET' });
        if (!response.ok) return;
        const payload = (await response.json()) as { navKeys?: string[] };
        if (mounted && Array.isArray(payload.navKeys)) {
          setActiveNavKeys(payload.navKeys);
        }
      } catch {
        // Keep default nav set if activation API is unavailable.
      }
    };

    void loadActivation();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredNavLinks = useMemo(() => {
    /** Income profiles intentionally expose only a subset of routes via `navKeys`. That hides most of the app from regular users. Admins / privileged accounts see the full catalog for development and QA. */
    const bypassIncomeNavFilter =
      session?.user?.role === 'SUPER_ADMIN' ||
      session?.user?.role === 'ADMIN' ||
      isPrivilegedEmail(session?.user?.email ?? null);
    if (bypassIncomeNavFilter) {
      return NavLinks;
    }
    if (!activeNavKeys || activeNavKeys.length === 0) return NavLinks;
    const allowed = new Set(activeNavKeys);
    return NavLinks.filter(link => !link.featureKey || allowed.has(link.featureKey));
  }, [activeNavKeys, session?.user?.role, session?.user?.email]);

  // Developer/debug mode: show debug info for super admin or if ?dev=1 is in the URL
  // const [showDebug, setShowDebug] = useState(false);
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const url = new URL(window.location.href);
  //     const isDev = url.searchParams.get('dev') === '1';
  //     const isSuperAdmin =
  //       session?.user?.email === '5epmgllc@gmail.com' || session?.user?.role === 'ADMIN';
  //     setShowDebug(isDev || isSuperAdmin);
  //   }
  // }, [session]);

  // const { data: debugSession, status: debugStatus } = useSession();

  const _renderNavLinks = (links: NavLink[]) => {
    return links.map(link => {
      const _isActive = pathname === link.href;
      const _Icon = link.icon;
      // Badge tooltip text
      let badgeTooltip = '';
      if (link.badge === 'Pro') badgeTooltip = 'Pro feature';
      if (link.badge === 'New') badgeTooltip = 'New feature';
      if (link.badge === 'Hot') badgeTooltip = 'Trending now';
      const _isPro = link.badge === 'Pro';
      const _isFreeUser = userTier === 'FREE';
      const _isDisabled = _isPro && _isFreeUser;

      const _content = (
        <span
          className={cn(
            'group flex items-center gap-3 px-3 py-2 my-1 rounded-xl font-medium transition-all duration-150',
            _isActive
              ? 'bg-primary/90 text-white font-bold shadow-sm'
              : _isDisabled
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-60'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'w-full min-w-0',
            _isDisabled && 'pointer-events-none select-none'
          )}
          tabIndex={_isDisabled ? -1 : 0}
          {...(_isDisabled ? { 'aria-disabled': 'true' } : {})}
        >
          {_Icon && <_Icon className="h-5 w-5 flex-shrink-0" />}
          {!isCollapsed && (
            <span className="flex min-w-0 flex-row items-center gap-2">
              <span className="min-w-0 truncate text-base">{link.title}</span>
              {_isDisabled && (
                <Icons.lock className="ml-1 h-4 w-4 text-gray-400" aria-label="Locked" />
              )}
              {link.badge && (
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold inline-block align-middle min-w-[2.5rem] text-center',
                    link.badge === 'Pro'
                      ? 'bg-primary/80 text-white'
                      : link.badge === 'Hot'
                        ? 'bg-orange-500/90 text-white'
                        : 'bg-muted text-foreground'
                  )}
                  style={{
                    maxWidth: '5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.badge}
                </span>
              )}
            </span>
          )}
        </span>
      );

      return (
        <TooltipProvider key={link.href}>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              {_isDisabled ? (
                _content
              ) : (
                <Link href={link.href} tabIndex={0} className="block w-full focus:outline-none">
                  {_content}
                </Link>
              )}
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {_isDisabled ? 'Upgrade to Pro to access' : badgeTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    });
  };

  // Add Dev Tools link for SUPER_ADMIN
  const _showDevTools = session?.user?.role === 'SUPER_ADMIN';

  return (
    <>
      <MobileSidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        pathname={pathname}
        NavLinks={filteredNavLinks}
        ThemeToggle={ThemeToggle}
      />
      <DesktopSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        pathname={pathname}
        NavLinks={filteredNavLinks}
        _categoryLabels={_categoryLabels}
        cn={cn}
        ThemeToggle={ThemeToggle}
        _renderNavLinks={_renderNavLinks}
        _showDevTools={_showDevTools}
      />
    </>
  );
}
