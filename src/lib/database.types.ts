export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          photo_url: string;
          goals: number;
          assists: number;
          clean_sheets: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          photo_url?: string;
          goals?: number;
          assists?: number;
          clean_sheets?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          photo_url?: string;
          goals?: number;
          assists?: number;
          clean_sheets?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_stat: {
        Args: {
          player_id: string;
          stat_column: string;
        };
        Returns: undefined;
      };
      decrement_stat: {
        Args: {
          player_id: string;
          stat_column: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
