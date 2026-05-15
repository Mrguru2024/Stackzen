import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSession } from 'next-auth/react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SavingsRule {
  id: string;
  user_id: string;
  name: string;
  type: string;
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsExecution {
  id: string;
  rule_id: string;
  user_id: string;
  amount: number;
  description?: string;
  executed_at: string;
  status: string;
  metadata?: any;
}

export interface SmartBucket {
  id: string;
  user_id: string;
  name: string;
  type: string;
  target_amount?: number;
  current_amount: number;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZenMission {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: string;
  target_value?: number;
  current_value: number;
  start_date: string;
  end_date?: string;
  status: string;
  difficulty: string;
  rewards?: any;
}

// Hook for real-time savings rules
export function useSavingsRulesRealtime() {
  const { data: session } = useSession();
  const [rules, setRules] = useState<SavingsRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const fetchRules = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/smart-saving/rules');
        if (response.ok) {
          const data = await response.json();
          setRules(data);
        }
      } catch (error) {
        console.error('Error fetching rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();

    // Real-time subscription
    const channel = supabase
      .channel('savings-rules-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_rules',
          filter: `user_id=eq.${session.user.email}`,
        },
        payload => {
          console.log('Savings rules real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            setRules(prev => [...prev, payload.new as SavingsRule]);
          } else if (payload.eventType === 'UPDATE') {
            setRules(prev =>
              prev.map(rule => (rule.id === payload.new.id ? (payload.new as SavingsRule) : rule))
            );
          } else if (payload.eventType === 'DELETE') {
            setRules(prev => prev.filter(rule => rule.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email]);

  return { rules, loading };
}

// Hook for real-time savings executions
export function useSavingsExecutionsRealtime(limit?: number) {
  const { data: session } = useSession();
  const [executions, setExecutions] = useState<SavingsExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const fetchExecutions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/smart-saving/executions?limit=${limit || 10}`);
        if (response.ok) {
          const data = await response.json();
          setExecutions(data);
        }
      } catch (error) {
        console.error('Error fetching executions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();

    // Real-time subscription
    const channel = supabase
      .channel('savings-executions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'savings_executions',
          filter: `user_id=eq.${session.user.email}`,
        },
        payload => {
          console.log('New savings execution:', payload);
          setExecutions(prev => [
            payload.new as SavingsExecution,
            ...prev.slice(0, (limit || 10) - 1),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email, limit]);

  return { executions, loading };
}

// Hook for real-time smart buckets
export function useSmartBucketsRealtime() {
  const { data: session } = useSession();
  const [buckets, setBuckets] = useState<SmartBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const fetchBuckets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/smart-saving/buckets');
        if (response.ok) {
          const data = await response.json();
          setBuckets(data);
        }
      } catch (error) {
        console.error('Error fetching buckets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuckets();

    // Real-time subscription
    const channel = supabase
      .channel('smart-buckets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'smart_buckets',
          filter: `user_id=eq.${session.user.email}`,
        },
        payload => {
          console.log('Smart buckets real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            setBuckets(prev => [...prev, payload.new as SmartBucket]);
          } else if (payload.eventType === 'UPDATE') {
            setBuckets(prev =>
              prev.map(bucket =>
                bucket.id === payload.new.id ? (payload.new as SmartBucket) : bucket
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setBuckets(prev => prev.filter(bucket => bucket.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email]);

  return { buckets, loading };
}

// Hook for real-time zen missions
export function useZenMissionsRealtime() {
  const { data: session } = useSession();
  const [missions, setMissions] = useState<ZenMission[]>([]);

  useEffect(() => {
    if (!session?.user?.email) return;

    // Initial fetch
    const fetchMissions = async () => {
      try {
        const response = await fetch('/api/smart-saving/missions');
        if (response.ok) {
          const data = await response.json();
          setMissions(data);
        }
      } catch (error) {
        console.error('Error fetching missions:', error);
      }
    };

    fetchMissions();

    // Real-time subscription
    const channel = supabase
      .channel('zen-missions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zen_missions',
          filter: `user_id=eq.${session.user.email}`,
        },
        payload => {
          console.log('Zen missions real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            setMissions(prev => [...prev, payload.new as ZenMission]);
          } else if (payload.eventType === 'UPDATE') {
            setMissions(prev =>
              prev.map(mission =>
                mission.id === payload.new.id ? (payload.new as ZenMission) : mission
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMissions(prev => prev.filter(mission => mission.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email]);

  return { missions };
}

// Generic hook for any table
export function useSupabaseRealtime<T>(
  table: string,
  userId?: string,
  options?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
  }
) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Real-time subscription
    const channel = supabase
      .channel(`${table}-realtime`)
      .on(
        'postgres_changes',
        {
          event: options?.event || '*',
          schema: 'public',
          table,
          filter: options?.filter || `user_id=eq.${userId}`,
        },
        payload => {
          console.log(`${table} real-time update:`, payload);

          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev =>
              prev.map(item => ((item as any).id === payload.new.id ? (payload.new as T) : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => (item as any).id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, userId, options]);

  return { data };
}
