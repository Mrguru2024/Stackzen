# Manual ESLint Fixes Needed for StackZenDemo

## Missing Component Imports
Add these imports to respective files:

### UI Components
```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
```

### React Hooks
```typescript
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
```

### Icons
```typescript
import { 
  Bell, Shield, Lock, Mail, Phone, MapPin, Globe, 
  TrendingUp, Users, Briefcase, Settings, Calendar,
  AlertTriangle, AlertCircle, Clock, CheckCircle,
  Share2, BarChart, LineChart, PieChart, Activity,
  FileText, Edit2, Trash2, Plus, CreditCard,
  DollarSign, Loader2, Target
} from 'lucide-react';
```

### Authentication & Providers
```typescript
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
```

## Function Naming Issues
Functions starting with 'use' that aren't hooks need to be renamed:
- `_SavedQuotesClient` → `SavedQuotesClient` 
- `_TeamViewPage` → `TeamViewPage`
- `_PaymentForm` → `PaymentForm`
- `_PaymentModal` → `PaymentModal`
- `_IncomeHub` → `IncomeHub`

## Unused Variables to Remove or Prefix
For parameters that must remain but are unused, prefix with underscore:
- `data` → `_data`
- `error` → `_error` 
- `event` → `_event`
- `index` → `_index`

## React Hook Dependencies
Fix useEffect dependency arrays by either:
1. Adding missing dependencies
2. Removing unnecessary dependencies  
3. Using useCallback for functions

## String Escaping
Fix unescaped apostrophes in JSX:
- `'` → `&apos;` or `&#39;`
