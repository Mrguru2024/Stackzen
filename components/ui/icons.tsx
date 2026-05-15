import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Command,
  CreditCard,
  File,
  FileText,
  HelpCircle,
  Image,
  Laptop,
  Loader2,
  LucideProps,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  Settings,
  SunMedium,
  Trash,
  Twitter,
  User,
  X,
  Eye,
  EyeOff,
  Menu,
  Building2,
  Search,
  Download,
  Calendar as CalendarIcon,
  PiggyBank,
  TrendingUp,
  Target,
  Trophy,
  ArrowDown,
  ArrowUp,
  DollarSign,
  Gift,
  Lock,
  type Icon as LucideIcon,
  LogOut,
} from 'lucide-react';

export type Icon = LucideIcon;

export const _Icons = {
  logo: Command,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  post: FileText,
  page: File,
  media: Image,
  settings: Settings,
  billing: CreditCard,
  ellipsis: MoreVertical,
  add: Plus,
  warning: AlertTriangle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  pizza: Pizza,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  menu: Menu,
  bank: Building2,
  search: Search,
  import: Download,
  calendar: CalendarIcon,
  download: Download,
  piggyBank: PiggyBank,
  trendingUp: TrendingUp,
  target: Target,
  trophy: Trophy,
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  plus: Plus,
  creditCard: CreditCard,
  dollarSign: DollarSign,
  gift: Gift,
  gitHub: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="github"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
      ></path>
    </svg>
  ),
  twitter: Twitter,
  check: Check,
  eye: Eye,
  eyeOff: EyeOff,
  google: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <g>
        <path
          fill="#4285F4"
          d="M21.805 10.023h-9.18v3.955h5.262c-.227 1.19-1.36 3.49-5.262 3.49-3.167 0-5.75-2.62-5.75-5.85s2.583-5.85 5.75-5.85c1.805 0 3.017.77 3.71 1.43l2.54-2.47C17.09 3.62 15.167 2.5 12.625 2.5 7.92 2.5 4.125 6.29 4.125 11s3.795 8.5 8.5 8.5c4.917 0 8.167-3.45 8.167-8.3 0-.56-.062-1.11-.17-1.677z"
        />
        <path
          fill="#34A853"
          d="M12.625 21c2.42 0 4.45-.8 5.93-2.17l-2.84-2.32c-.79.53-1.8.85-3.09.85-2.38 0-4.4-1.61-5.12-3.77H4.125v2.37A8.5 8.5 0 0 0 12.625 21z"
        />
        <path
          fill="#FBBC05"
          d="M7.505 13.61a5.13 5.13 0 0 1 0-3.22V7.99H4.125a8.5 8.5 0 0 0 0 7.02l3.38-2.4z"
        />
        <path
          fill="#EA4335"
          d="M12.625 6.58c1.32 0 2.5.45 3.43 1.33l2.57-2.5C17.07 3.62 15.17 2.5 12.625 2.5A8.5 8.5 0 0 0 4.125 7.99l3.38 2.4c.72-2.16 2.74-3.81 5.12-3.81z"
        />
      </g>
    </svg>
  ),
  lock: Lock,
  layoutDashboard: Laptop,
  receipt: FileText,
  x: X,
  logout: LogOut,
};

/** Allow `Icons.someLucideName` for icons not yet added to the map (typed as LucideIcon). */
export const Icons = _Icons as typeof _Icons & Record<string, Icon>;
