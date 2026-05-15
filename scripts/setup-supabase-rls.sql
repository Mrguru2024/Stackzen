-- Enable Row Level Security on all smart saving tables
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

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE savings_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE savings_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE smart_buckets;
ALTER PUBLICATION supabase_realtime ADD TABLE smart_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE zen_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE zen_investments; 