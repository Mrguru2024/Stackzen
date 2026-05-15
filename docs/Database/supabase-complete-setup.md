# Complete Supabase Setup Guide for StackZen - Updated June 2025

## 🎯 Current Status

✅ **Environment Variables**: Configured  
✅ **Database Tables**: Created via Prisma migration  
✅ **Database Connection**: Working  
❌ **RLS Policies**: Need manual setup  
✅ **Real-time**: Ready to enable

**Status: 🔄 PLANNED - Next Phase Development**

## 🔧 Step-by-Step Setup (PLANNED)

### 1. Access Your Supabase Dashboard

Go to: https://supabase.com/dashboard/project/sbenbbowvumgbslnzsxu

### 2. Set Up Row Level Security (RLS) (PLANNED)

#### Step 2.1: Enable RLS on Tables

1. Go to **Authentication > Policies**
2. For each table, click **"Enable RLS"**:
   - `savings_rules`
   - `savings_executions`
   - `smart_buckets`
   - `smart_allocations`
   - `zen_missions`
   - `zen_investments`

#### Step 2.2: Create RLS Policies

Run this SQL in the **SQL Editor**:

```sql
-- Enable RLS on all smart saving tables
ALTER TABLE savings_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zen_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zen_investments ENABLE ROW LEVEL SECURITY;

-- Savings Rules Policies
CREATE POLICY "Users can view their own savings rules" ON savings_rules
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own savings rules" ON savings_rules
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own savings rules" ON savings_rules
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own savings rules" ON savings_rules
  FOR DELETE USING (auth.uid()::text = user_id);

-- Savings Executions Policies
CREATE POLICY "Users can view their own savings executions" ON savings_executions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own savings executions" ON savings_executions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own savings executions" ON savings_executions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Smart Buckets Policies
CREATE POLICY "Users can view their own smart buckets" ON smart_buckets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own smart buckets" ON smart_buckets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own smart buckets" ON smart_buckets
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own smart buckets" ON smart_buckets
  FOR DELETE USING (auth.uid()::text = user_id);

-- Smart Allocations Policies
CREATE POLICY "Users can view their own smart allocations" ON smart_allocations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own smart allocations" ON smart_allocations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own smart allocations" ON smart_allocations
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Zen Missions Policies
CREATE POLICY "Users can view their own zen missions" ON zen_missions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own zen missions" ON zen_missions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own zen missions" ON zen_missions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own zen missions" ON zen_missions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Zen Investments Policies
CREATE POLICY "Users can view their own zen investments" ON zen_investments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own zen investments" ON zen_investments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own zen investments" ON zen_investments
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own zen investments" ON zen_investments
  FOR DELETE USING (auth.uid()::text = user_id);
```

### 3. Enable Real-time Subscriptions (PLANNED)

Run this SQL to enable real-time for all tables:

```sql
-- Enable real-time for all smart saving tables
ALTER PUBLICATION supabase_realtime ADD TABLE savings_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE savings_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE smart_buckets;
ALTER PUBLICATION supabase_realtime ADD TABLE smart_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE zen_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE zen_investments;
```

### 4. Test the Setup (PLANNED)

Run the test script:

```bash
node scripts/test-supabase-config.js
```

### 5. Switch to Supabase (PLANNED)

Update your `.env.local`:

```bash
# Change this to use Supabase
USE_SUPABASE_FOR_SMART_SAVING=true
```

## 🚀 Features Planned (Q3 2025)

### Real-time Updates

- **Live rule changes**: Updates immediately when rules are modified
- **Live executions**: New savings executions appear instantly
- **Live bucket updates**: Bucket balances update in real-time
- **Live mission progress**: Mission status updates live

### Smart Saving Controls

- **Round-up rules**: Automatically save spare change
- **Auto-saver**: Recurring automatic savings
- **Budget saver**: Save surplus from budget categories
- **Trigger save**: Save when spending on specific items
- **Income splitter**: Automatically split income into buckets

### Settings Integration

- **Smart Saving tab**: Full control panel in user settings
- **Real-time toggles**: Enable/disable rules instantly
- **Configuration**: Customize rule parameters
- **Live feedback**: See changes immediately

## 📊 Database Schema (PLANNED)

### Tables to be Created

- `savings_rules` - User's savings automation rules
- `savings_executions` - Record of rule executions
- `smart_buckets` - Organized savings buckets
- `smart_allocations` - Money allocated to buckets
- `zen_missions` - Financial challenges and goals
- `zen_investments` - Investment portfolios

### Relationships

- All tables linked to `users` via `user_id`
- `savings_executions` linked to `savings_rules` via `rule_id`
- `smart_allocations` linked to `smart_buckets` via `bucket_id`

## 🔄 Migration Script (PLANNED)

The migration script (`scripts/sync-prisma-to-supabase.js`) will:

1. Set up RLS policies
2. Test table access
3. Verify real-time subscriptions
4. Provide setup status

## 🎯 Current Implementation Status

### ✅ Completed Features

- [x] Complete authentication system (NextAuth.js)
- [x] Multi-step onboarding with AI personalization
- [x] Income and expense tracking
- [x] Quote and invoice generation
- [x] Client management system
- [x] Complete mentor platform
- [x] Video session integration
- [x] Payment processing with Stripe
- [x] Email notifications
- [x] Analytics dashboard
- [x] Admin panel
- [x] Mobile responsive design
- [x] Error monitoring with Sentry

### 🔄 Next Phase Features (Q3 2025)

- [ ] Financial wellness scorecard
- [ ] Smart savings system (Supabase integration)
- [ ] Bank integration (Plaid)
- [ ] Enhanced AI features
- [ ] Receipt scanner with OCR

## 🚀 Development Timeline

### Q3 2025 (Planned)

- [ ] Smart saving system implementation
- [ ] Supabase integration
- [ ] RLS policy setup
- [ ] Testing and validation

### Q4 2025 (Planned)

- [ ] Advanced features
- [ ] Performance optimization
- [ ] Production deployment

## 🎛️ Environment Configuration

### Development (Current)

```bash
USE_SUPABASE_FOR_SMART_SAVING=false  # Uses Prisma
NODE_ENV=development
```

### Production (Planned)

```bash
USE_SUPABASE_FOR_SMART_SAVING=true   # Uses Supabase
NODE_ENV=production
```

## 🔄 Switching Between Databases

### To Use Prisma (Current)

```bash
# In .env.local
USE_SUPABASE_FOR_SMART_SAVING=false
```

### To Use Supabase (Planned)

```bash
# In .env.local
USE_SUPABASE_FOR_SMART_SAVING=true
```

## 🎯 Next Steps

1. **Complete MVP Launch** - Deploy current features to production
2. **Plan Smart Saving** - Design and implement smart saving features
3. **Set up RLS policies** in Supabase dashboard
4. **Enable real-time** for all tables
5. **Test the setup** with the test script
6. **Switch to Supabase** by updating environment variable
7. **Test real-time features** in the app

## 🆘 Troubleshooting

### Permission Denied Errors

- Ensure RLS policies are created correctly
- Check that user authentication is working
- Verify table names match exactly

### Real-time Not Working

- Ensure real-time is enabled in Supabase
- Check that tables are added to `supabase_realtime` publication
- Verify client-side subscription setup

### Data Not Syncing

- Both Prisma and Supabase can be used simultaneously
- Data is not automatically synced between them
- Choose one database per environment for consistency

## 📊 Benefits of Hybrid Setup

- **Development**: Use Prisma for faster iteration
- **Production**: Use Supabase for real-time features
- **Scalability**: Easy to switch between databases
- **Security**: RLS policies for data protection

---

**Status: Planned for Next Development Phase**  
**Priority: High - Core to StackZen value proposition**  
**Dependencies: Mentor system complete, income tracking stable**  
**Target Implementation: Q3 2025**
