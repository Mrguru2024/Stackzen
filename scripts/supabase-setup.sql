-- StackZen Supabase Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on all smart saving tables
ALTER TABLE savings_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zen_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zen_investments ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policies for savings_rules
CREATE POLICY "Users can view their own savings rules" ON savings_rules
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own savings rules" ON savings_rules
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own savings rules" ON savings_rules
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own savings rules" ON savings_rules
  FOR DELETE USING (auth.uid()::text = user_id);

-- 3. Create RLS Policies for savings_executions
CREATE POLICY "Users can view their own savings executions" ON savings_executions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own savings executions" ON savings_executions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own savings executions" ON savings_executions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- 4. Create RLS Policies for smart_buckets
CREATE POLICY "Users can view their own smart buckets" ON smart_buckets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own smart buckets" ON smart_buckets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own smart buckets" ON smart_buckets
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own smart buckets" ON smart_buckets
  FOR DELETE USING (auth.uid()::text = user_id);

-- 5. Create RLS Policies for smart_allocations
CREATE POLICY "Users can view their own smart allocations" ON smart_allocations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own smart allocations" ON smart_allocations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own smart allocations" ON smart_allocations
  FOR UPDATE USING (auth.uid()::text = user_id);

-- 6. Create RLS Policies for zen_missions
CREATE POLICY "Users can view their own zen missions" ON zen_missions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own zen missions" ON zen_missions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own zen missions" ON zen_missions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own zen missions" ON zen_missions
  FOR DELETE USING (auth.uid()::text = user_id);

-- 7. Create RLS Policies for zen_investments
CREATE POLICY "Users can view their own zen investments" ON zen_investments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own zen investments" ON zen_investments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own zen investments" ON zen_investments
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own zen investments" ON zen_investments
  FOR DELETE USING (auth.uid()::text = user_id);

-- 8. Enable real-time for all smart saving tables
ALTER PUBLICATION supabase_realtime ADD TABLE savings_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE savings_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE smart_buckets;
ALTER PUBLICATION supabase_realtime ADD TABLE smart_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE zen_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE zen_investments;

-- 9. Create some default smart buckets for testing
INSERT INTO smart_buckets (id, user_id, name, type, target_amount, current_amount, color, icon, is_active, created_at, updated_at)
VALUES 
  ('default-emergency', '00000000-0000-0000-0000-000000000000', 'Emergency Fund', 'emergency', 10000, 0, '#ef4444', 'shield', true, NOW(), NOW()),
  ('default-goals', '00000000-0000-0000-0000-000000000000', 'Goals', 'goals', 5000, 0, '#3b82f6', 'target', true, NOW(), NOW()),
  ('default-fun', '00000000-0000-0000-0000-000000000000', 'Fun Money', 'fun', 1000, 0, '#10b981', 'gift', true, NOW(), NOW()),
  ('default-tax', '00000000-0000-0000-0000-000000000000', 'Tax Buffer', 'tax', 2000, 0, '#f59e0b', 'calculator', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 10. Verify setup
SELECT 
  'RLS Enabled' as check_type,
  table_name,
  CASE WHEN row_security = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('savings_rules', 'savings_executions', 'smart_buckets', 'smart_allocations', 'zen_missions', 'zen_investments')
ORDER BY table_name; 