#!/bin/bash

# StackZenDemo ESLint Fix Script
# This script addresses the specific ESLint issues found in your project

echo "🔧 Fixing ESLint issues in StackZenDemo..."

# 1. Auto-fix what ESLint can handle
echo "1. Running ESLint auto-fix..."
npx eslint . --fix --ext .ts,.tsx,.js,.jsx

# 2. Fix missing React imports (most common issue)
echo "2. Adding missing React imports..."

# Add React import to files that use JSX but don't import React
find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -L "import.*React" {} \; | while read file; do
    if grep -q "React\." "$file" || grep -q "<" "$file"; then
        echo "Adding React import to $file"
        sed -i.bak '1i\
import React from '\''react'\'';
' "$file"
    fi
done

# 3. Fix missing framer-motion imports
echo "3. Adding missing framer-motion imports..."
grep -r "motion\." --include="*.tsx" --include="*.ts" . | grep -v node_modules | cut -d: -f1 | sort -u | while read file; do
    if ! grep -q "import.*motion" "$file"; then
        echo "Adding motion import to $file"
        sed -i.bak '1a\
import { motion } from '\''framer-motion'\'';
' "$file"
    fi
done

# 4. Fix missing UI component imports (common ones)
echo "4. Adding missing UI component imports..."

# Card components
grep -r "\<Card\>" --include="*.tsx" . | grep -v node_modules | grep -v "import.*Card" | cut -d: -f1 | sort -u | while read file; do
    if ! grep -q "import.*Card" "$file"; then
        echo "Adding Card import to $file"
        sed -i.bak '1a\
import { Card, CardContent, CardHeader, CardTitle } from '\''@/components/ui/card'\'';
' "$file"
    fi
done

# Button components
grep -r "\<Button\>" --include="*.tsx" . | grep -v node_modules | grep -v "import.*Button" | cut -d: -f1 | sort -u | while read file; do
    if ! grep -q "import.*Button" "$file"; then
        echo "Adding Button import to $file"
        sed -i.bak '1a\
import { Button } from '\''@/components/ui/button'\'';
' "$file"
    fi
done

# 5. Remove unused imports (be careful with this)
echo "5. Removing obviously unused imports..."

# Remove unused icon imports
find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "import.*lucide-react" {} \; | while read file; do
    # This is a simplified approach - you might want to be more careful
    echo "Check unused icons in $file manually"
done

# 6. Fix function naming issues (React hooks rules)
echo "6. Fixing React hooks naming issues..."

# Find functions that start with 'use' but aren't hooks
grep -rn "function _.*use" --include="*.tsx" --include="*.ts" . | grep -v node_modules | while IFS=: read file line content; do
    echo "⚠️  Manual fix needed in $file:$line - Rename function to not start with 'use' or make it a proper hook"
done

# 7. Create a summary of remaining manual fixes needed
echo "7. Creating summary of manual fixes needed..."

cat > manual-fixes-needed.md << 'EOF'
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
EOF

echo "✅ Manual fixes guide created: manual-fixes-needed.md"

# 8. Run a final ESLint check to see remaining issues
echo "8. Running final ESLint check..."
npx eslint . --ext .ts,.tsx,.js,.jsx > remaining-eslint-issues.txt 2>&1

echo ""
echo "🎉 ESLint fix script completed!"
echo ""
echo "📋 Summary:"
echo "- Auto-fixable issues have been resolved"
echo "- Missing imports have been added where possible"
echo "- Manual fixes needed are documented in 'manual-fixes-needed.md'"
echo "- Remaining issues are in 'remaining-eslint-issues.txt'"
echo ""
echo "⚠️  Remember to:"
echo "1. Test your application after these changes"
echo "2. Review the manual fixes needed"
echo "3. Clean up any .bak files created during the process"
echo "4. Commit your changes in small, logical chunks"

# Clean up backup files (optional)
read -p "Remove .bak files created during the process? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    find . -name "*.bak" -not -path "./node_modules/*" -delete
    echo "✅ Backup files removed"
fi

echo ""
echo "🚀 You can now run 'npm run lint' to check the remaining issues!" 