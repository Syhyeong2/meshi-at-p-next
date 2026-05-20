export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      healthy_environment: {
        Row: {
          environment: "local" | "preview" | "production";
        };
        Insert: {
          environment: "local" | "preview" | "production";
        };
        Update: {
          environment?: "local" | "preview" | "production";
        };
        Relationships: [];
      };
      invite_codes: {
        Row: {
          code: string;
          used_at: string | null;
          expires_at: string;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          used_at?: string | null;
          expires_at: string;
          used_by?: string | null;
          created_at?: string;
        };
        Update: {
          code?: string;
          used_at?: string | null;
          expires_at?: string;
          used_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invite_codes_used_by_fkey";
            columns: ["used_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      place_bookmarks: {
        Row: {
          user_id: string;
          place_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          place_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          place_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "place_bookmarks_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "place_bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          id: string;
          google_place_id: string;
          name: string;
          lat: number;
          lng: number;
          image_url: string | null;
          photo_attributions: Json;
          category: string | null;
          price_range: number | null;
          is_gochimeshi: boolean;
          avg_rating: number;
          review_count: number;
          distance_from_office_meters: number | null;
          walking_duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          google_place_id: string;
          name: string;
          lat: number;
          lng: number;
          image_url?: string | null;
          photo_attributions?: Json;
          category?: string | null;
          price_range?: number | null;
          is_gochimeshi?: boolean;
          avg_rating?: number;
          review_count?: number;
          distance_from_office_meters?: number | null;
          walking_duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          google_place_id?: string;
          name?: string;
          lat?: number;
          lng?: number;
          image_url?: string | null;
          photo_attributions?: Json;
          category?: string | null;
          price_range?: number | null;
          is_gochimeshi?: boolean;
          avg_rating?: number;
          review_count?: number;
          distance_from_office_meters?: number | null;
          walking_duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          nickname: string;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["user_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["user_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["user_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          rating: number;
          price_range: number | null;
          comment: string | null;
          visited_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          place_id: string;
          rating: number;
          price_range?: number | null;
          comment?: string | null;
          visited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          place_id?: string;
          rating?: number;
          price_range?: number | null;
          comment?: string | null;
          visited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      review_likes: {
        Row: {
          user_id: string;
          review_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          review_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          review_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      review_tags: {
        Row: {
          review_id: string;
          tag_id: string;
        };
        Insert: {
          review_id: string;
          tag_id: string;
        };
        Update: {
          review_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_tags_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      tag_categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          category_id: string;
          emoji: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id: string;
          emoji?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category_id?: string;
          emoji?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "tag_categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_external_places_dump: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: string;
          google_place_id: string;
          category: string | null;
          avg_rating: number;
          review_count: number;
          tags: Json;
        }[];
      };
      get_place_popular_review_tags: {
        Args: {
          p_place_id: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          name: string;
          emoji: string | null;
          category_id: string;
          review_count: number;
        }[];
      };
    };
    Enums: {
      user_role: "USER" | "ADMIN";
      user_status: "ACTIVE" | "SUSPENDED";
    };
    CompositeTypes: Record<string, never>;
  };
};
