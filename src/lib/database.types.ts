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
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hubs: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hubs_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      hub_members: {
        Row: {
          id: string;
          hub_id: string;
          user_id: string;
          role: string;
          goals: number;
          assists: number;
          clean_sheets: number;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          user_id: string;
          role?: string;
          goals?: number;
          assists?: number;
          clean_sheets?: number;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          user_id?: string;
          role?: string;
          goals?: number;
          assists?: number;
          clean_sheets?: number;
          joined_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hub_members_hub_id_fkey";
            columns: ["hub_id"];
            referencedRelation: "hubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hub_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          hub_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_hub_id_fkey";
            columns: ["hub_id"];
            referencedRelation: "hubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      stat_logs: {
        Row: {
          id: string;
          hub_id: string;
          member_id: string;
          actor_id: string;
          stat_type: string;
          delta: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          member_id: string;
          actor_id: string;
          stat_type: string;
          delta: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          member_id?: string;
          actor_id?: string;
          stat_type?: string;
          delta?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stat_logs_hub_id_fkey";
            columns: ["hub_id"];
            referencedRelation: "hubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_logs_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "hub_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_logs_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
      increment_hub_stat: {
        Args: {
          p_member_id: string;
          p_stat_column: string;
          p_hub_id: string;
        };
        Returns: undefined;
      };
      decrement_hub_stat: {
        Args: {
          p_member_id: string;
          p_stat_column: string;
          p_hub_id: string;
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
