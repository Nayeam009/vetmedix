export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at: string
          doctor_id: string | null
          id: string
          pet_name: string | null
          pet_type: string | null
          reason: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          pet_name?: string | null
          pet_type?: string | null
          reason?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          pet_name?: string | null
          pet_type?: string | null
          reason?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_doctors: {
        Row: {
          clinic_id: string
          doctor_id: string
          id: string
          joined_at: string
          status: string | null
        }
        Insert: {
          clinic_id: string
          doctor_id: string
          id?: string
          joined_at?: string
          status?: string | null
        }
        Update: {
          clinic_id?: string
          doctor_id?: string
          id?: string
          joined_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          distance: string | null
          email: string | null
          id: string
          image_url: string | null
          is_open: boolean | null
          is_verified: boolean | null
          name: string
          opening_hours: string | null
          owner_user_id: string | null
          phone: string | null
          rating: number | null
          services: string[] | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          distance?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_open?: boolean | null
          is_verified?: boolean | null
          name: string
          opening_hours?: string | null
          owner_user_id?: string | null
          phone?: string | null
          rating?: number | null
          services?: string[] | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          distance?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_open?: boolean | null
          is_verified?: boolean | null
          name?: string
          opening_hours?: string | null
          owner_user_id?: string | null
          phone?: string | null
          rating?: number | null
          services?: string[] | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          pet_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consultation_fee: number | null
          created_at: string
          created_by_clinic_id: string | null
          email: string | null
          experience_years: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          license_number: string | null
          name: string
          phone: string | null
          qualifications: string[] | null
          specialization: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          created_by_clinic_id?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          name: string
          phone?: string | null
          qualifications?: string[] | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          created_by_clinic_id?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          name?: string
          phone?: string | null
          qualifications?: string[] | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_created_by_clinic_id_fkey"
            columns: ["created_by_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_pet_id: string | null
          follower_user_id: string
          following_pet_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_pet_id?: string | null
          follower_user_id: string
          following_pet_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_pet_id?: string | null
          follower_user_id?: string
          following_pet_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_pet_id_fkey"
            columns: ["follower_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_pet_id_fkey"
            columns: ["following_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          pet_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_pet_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          target_appointment_id: string | null
          target_order_id: string | null
          target_pet_id: string | null
          target_post_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_pet_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_appointment_id?: string | null
          target_order_id?: string | null
          target_pet_id?: string | null
          target_post_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_pet_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_appointment_id?: string | null
          target_order_id?: string | null
          target_pet_id?: string | null
          target_post_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_pet_id_fkey"
            columns: ["actor_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_pet_id_fkey"
            columns: ["target_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_post_id_fkey"
            columns: ["target_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          payment_method: string | null
          shipping_address: string | null
          status: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          payment_method?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          age: string | null
          avatar_url: string | null
          bio: string | null
          breed: string | null
          cover_photo_url: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          species: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          breed?: string | null
          cover_photo_url?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          species: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          breed?: string | null
          cover_photo_url?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          species?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          id: string
          likes_count: number | null
          media_type: string | null
          media_urls: string[] | null
          pet_id: string
          shares_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_urls?: string[] | null
          pet_id: string
          shares_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_urls?: string[] | null
          pet_id?: string
          shares_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          category: string
          created_at: string
          description: string | null
          discount: number | null
          id: string
          image_url: string | null
          images: string[] | null
          name: string
          price: number
          product_type: string | null
          stock: number | null
        }
        Insert: {
          badge?: string | null
          category: string
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name: string
          price: number
          product_type?: string | null
          stock?: number | null
        }
        Update: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name?: string
          price?: number
          product_type?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          district: string | null
          division: string | null
          full_name: string | null
          id: string
          phone: string | null
          thana: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          division?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          thana?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          division?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          thana?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          pet_id: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          pet_id: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          pet_id?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_user_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_user_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_doctor_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_owner: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "doctor" | "clinic_owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "doctor", "clinic_owner"],
    },
  },
} as const
