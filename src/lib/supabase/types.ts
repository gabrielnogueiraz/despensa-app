export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type ShoppingListStatus = 'draft' | 'active' | 'completed' | 'archived';
export type SessionStatus = 'in_progress' | 'completed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          name: string;
          currency: string;
          monthly_budget: number;
          shopping_frequency?: string | null;
          preferred_shopping_day?: number | null;
          onboarding_completed_at?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          currency?: string;
          monthly_budget?: number;
          shopping_frequency?: string | null;
          preferred_shopping_day?: number | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          currency?: string;
          monthly_budget?: number;
          shopping_frequency?: string | null;
          preferred_shopping_day?: number | null;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: MemberRole;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "household_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      household_invitations: {
        Row: {
          id: string;
          household_id: string;
          invited_by: string;
          token: string;
          status: InvitationStatus;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          invited_by: string;
          token: string;
          status?: InvitationStatus;
          expires_at: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          status?: InvitationStatus;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          icon: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          icon?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          household_id: string;
          category_id: string | null;
          name: string;
          default_unit: string;
          default_price: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id?: string | null;
          name: string;
          default_unit?: string;
          default_price?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          default_unit?: string;
          default_price?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_items: {
        Row: {
          id: string;
          household_id: string;
          product_id: string;
          target_quantity: number;
          unit: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          product_id: string;
          target_quantity?: number;
          unit?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          target_quantity?: number;
          unit?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      shopping_lists: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          period_month: number;
          period_year: number;
          budget_target: number;
          status: ShoppingListStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          period_month: number;
          period_year: number;
          budget_target?: number;
          status?: ShoppingListStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          budget_target?: number;
          status?: ShoppingListStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      shopping_list_items: {
        Row: {
          id: string;
          shopping_list_id: string;
          product_id: string | null;
          custom_name: string;
          category_id: string | null;
          planned_quantity: number;
          unit: string;
          estimated_price: number;
          is_added_during_shopping: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shopping_list_id: string;
          product_id?: string | null;
          custom_name: string;
          category_id?: string | null;
          planned_quantity?: number;
          unit?: string;
          estimated_price?: number;
          is_added_during_shopping?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          custom_name?: string;
          category_id?: string | null;
          planned_quantity?: number;
          unit?: string;
          estimated_price?: number;
          is_added_during_shopping?: boolean;
        };
        Relationships: [];
      };
      shopping_sessions: {
        Row: {
          id: string;
          household_id: string;
          shopping_list_id: string | null;
          started_by: string;
          started_at: string;
          finished_at: string | null;
          budget_target: number;
          total_spent: number;
          total_items_count: number;
          notes: string | null;
          status: SessionStatus;
        };
        Insert: {
          id?: string;
          household_id: string;
          shopping_list_id?: string | null;
          started_by: string;
          started_at?: string;
          finished_at?: string | null;
          budget_target?: number;
          total_spent?: number;
          total_items_count?: number;
          notes?: string | null;
          status?: SessionStatus;
        };
        Update: {
          id?: string;
          finished_at?: string | null;
          total_spent?: number;
          total_items_count?: number;
          notes?: string | null;
          status?: SessionStatus;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          shopping_session_id: string;
          shopping_list_item_id: string | null;
          product_id: string | null;
          item_name: string;
          category_id: string | null;
          quantity: number;
          unit_price: number;
          discount: number;
          subtotal: number;
          checked_by: string | null;
          checked_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shopping_session_id: string;
          shopping_list_item_id?: string | null;
          product_id?: string | null;
          item_name: string;
          category_id?: string | null;
          quantity?: number;
          unit_price?: number;
          discount?: number;
          checked_by?: string | null;
          checked_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_name?: string;
          category_id?: string | null;
          quantity?: number;
          unit_price?: number;
          discount?: number;
          checked_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_initial_household: {
        Args: {
          p_user_id: string;
          p_user_name: string;
          p_household_name?: string;
          p_budget?: number;
          p_frequency?: string;
        };
        Returns: string;
      };
      accept_household_invitation: {
        Args: {
          p_token: string;
          p_user_id: string;
        };
        Returns: string;
      };
      generate_monthly_list: {
        Args: {
          p_household_id: string;
          p_month: number;
          p_year: number;
          p_budget?: number;
        };
        Returns: string;
      };
      finish_shopping_session: {
        Args: {
          p_session_id: string;
        };
        Returns: void;
      };
    };
  };
}
