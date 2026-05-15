/**
 * Drizzle + postgres-js client for legacy SQL paths. Prefer `@/lib/prisma` for new code.
 * Supabase JS client (anon) for public-table reads where still required.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';
import { createClient } from '@supabase/supabase-js';

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });

export async function getDb() {
  return db;
}

/** @deprecated Import from `@/lib/prisma` instead */
export { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StackZenGig = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration?: string;
  budget?: number;
  rating?: number;
  posted_by?: string;
  skills: string[];
  is_pro_only: boolean;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      stackzengig: {
        Row: StackZenGig;
        Insert: Omit<StackZenGig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StackZenGig, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};
