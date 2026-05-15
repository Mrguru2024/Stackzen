'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_OPERATIONAL_REALTIME !== 'false';

/**
 * Subscribes to Supabase Realtime for rows that drive the operational queue.
 * Requires DB publication + RLS; if unavailable, subscription may no-op — user still has manual refresh.
 */
export function useOperationalAttentionRealtime(input: {
  userId: string | undefined;
  onOperationalChange: () => void;
}): void {
  const { userId, onOperationalChange } = input;
  const cbRef = useRef(onOperationalChange);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cbRef.current = onOperationalChange;
  }, [onOperationalChange]);

  useEffect(() => {
    if (!ENABLED || !userId) return;

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        cbRef.current();
        timerRef.current = null;
      }, 450);
    };

    const channel = supabase
      .channel(`operational-attention-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'AutomationNotification',
          filter: `userId=eq.${userId}`,
        },
        () => schedule()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'FinancialEvent',
          filter: `userId=eq.${userId}`,
        },
        () => schedule()
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [userId]);
}
