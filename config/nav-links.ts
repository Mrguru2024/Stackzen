import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  LineChart,
  Settings,
  CreditCard,
  Receipt,
  Landmark,
  Users,
  FileText,
  CircleDollarSign,
  Target,
  Award,
  FileText as FileQuote,
  LucideIcon,
  UserCircle,
  GraduationCap,
  Shield,
  BarChart3,
  Activity,
  ClipboardList,
  Workflow,
  BellRing,
} from 'lucide-react';

export type NavLink = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: 'New' | 'Hot' | 'Pro';
  featureKey?: string;
  category: 'main' | 'income' | 'finance' | 'tools' | 'settings';
};

export const NavLinks: NavLink[] = [
  // Main Navigation
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    featureKey: 'dashboard',
    category: 'main',
  },
  {
    title: 'Income Hub',
    href: '/income-hub',
    icon: Wallet,
    badge: 'New',
    featureKey: 'income-hub',
    category: 'main',
  },
  {
    title: 'Mentors',
    href: '/mentors',
    icon: GraduationCap,
    badge: 'New',
    category: 'main',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    badge: 'New',
    featureKey: 'analytics',
    category: 'main',
  },
  {
    title: 'Financial Timeline',
    href: '/financial-timeline',
    icon: Activity,
    featureKey: 'financial-timeline',
    category: 'main',
  },

  // Income & Services
  {
    title: 'Clients',
    href: '/clients',
    icon: UserCircle,
    featureKey: 'clients',
    category: 'income',
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: FileText,
    featureKey: 'invoices',
    category: 'income',
  },
  {
    title: 'Income sources',
    href: '/income/sources',
    icon: Landmark,
    badge: 'New',
    featureKey: 'income/sources',
    category: 'income',
  },
  {
    title: 'Services',
    href: '/income-hub/services',
    icon: CircleDollarSign,
    featureKey: 'income-hub/services',
    category: 'income',
  },
  {
    title: 'Quotes',
    href: '/quotes',
    icon: FileQuote,
    featureKey: 'quotes',
    category: 'income',
  },
  {
    title: 'Jobs',
    href: '/jobs',
    icon: ClipboardList,
    featureKey: 'jobs',
    category: 'income',
  },
  {
    title: 'Affiliate Program',
    href: '/income/affiliates',
    icon: Users,
    featureKey: 'income/affiliates',
    category: 'income',
  },

  // Financial Tools
  {
    title: 'Money Challenges',
    href: '/income/challenges',
    icon: Target,
    badge: 'Pro',
    featureKey: 'income/challenges',
    category: 'finance',
  },
  {
    title: 'Investment Wizard',
    href: '/income/investments',
    icon: LineChart,
    badge: 'Pro',
    featureKey: 'income/investments',
    category: 'finance',
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: Receipt,
    featureKey: 'expenses',
    category: 'finance',
  },
  {
    title: 'Savings',
    href: '/savings',
    icon: PiggyBank,
    featureKey: 'savings',
    category: 'finance',
  },
  {
    title: 'Cards',
    href: '/cards',
    icon: CreditCard,
    featureKey: 'cards',
    category: 'finance',
  },
  {
    title: 'Operations hub',
    href: '/operational-center',
    icon: BellRing,
    badge: 'New',
    featureKey: 'operational-center',
    category: 'finance',
  },
  {
    title: 'Cash Flow',
    href: '/cash-flow',
    icon: LineChart,
    badge: 'New',
    featureKey: 'cash-flow',
    category: 'finance',
  },
  {
    title: 'Money Control',
    href: '/money-control',
    icon: Workflow,
    badge: 'New',
    featureKey: 'money-control',
    category: 'finance',
  },
  {
    title: 'Operational Goals',
    href: '/goals/operational',
    icon: Target,
    badge: 'New',
    featureKey: 'goals/operational',
    category: 'finance',
  },

  // Additional Tools
  {
    title: 'Creative Grants',
    href: '/income/grants',
    icon: Award,
    badge: 'Pro',
    featureKey: 'income/grants',
    category: 'tools',
  },

  // Settings
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    featureKey: 'settings',
    category: 'settings',
  },
  {
    title: 'Payments',
    href: '/settings/payments',
    icon: CreditCard,
    featureKey: 'settings/payments',
    category: 'settings',
  },
  {
    title: 'Admin - Mentors',
    href: '/admin/mentors',
    icon: Shield,
    category: 'settings',
  },
];
