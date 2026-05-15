// Types for Supabase-backed tables (extend as needed)
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
