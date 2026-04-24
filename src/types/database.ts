// Supabase Database Types — WANDERKIND V6.0
// These types define the complete data model for all 121 screens.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          trail_name: string;
          email: string;
          bio: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          gallery: string[];
          role: 'walker' | 'host' | 'both';
          tier: TierLevel;
          nights_walked: number;
          stamps_count: number;
          hosts_stayed: number;
          is_walking: boolean;
          is_verified: boolean;
          verification_level: VerificationLevel;
          language: string;
          theme: 'light' | 'dark' | 'system';
          ghost_presence: boolean;
          searchable: boolean;
          quiet_mode: boolean;
          skills: string[];
          emergency_contacts: EmergencyContact[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      hosts: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          description: string | null;
          lat: number;
          lng: number;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          host_type: 'free' | 'donativo' | 'budget' | 'paid';
          price_range: string | null;
          capacity: number;
          amenities: string[];
          house_rules: string[];
          gallery: string[];
          is_available: boolean;
          availability_start: string | null;
          availability_end: string | null;
          availability_notes: string | null;
          verification_level: VerificationLevel;
          source: string;
          freshness: string | null;
          response_time_hours: number | null;
          total_hosted: number;
          rating: number | null;
          route_id: string | null;
          route_km: number | null;
          is_bicycle_friendly: boolean;
          is_family_friendly: boolean;
          is_women_verified: boolean;
          is_wheelchair_accessible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hosts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['hosts']['Insert']>;
      };
      stamps: {
        Row: {
          id: string;
          walker_id: string;
          host_id: string;
          host_name: string;
          route_id: string | null;
          route_km: number | null;
          night_number: number;
          photo_url: string | null;
          note: string | null;
          reflection: string | null;
          reflection_public: boolean;
          category: StampCategory;
          verification_hash: string;
          previous_hash: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stamps']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stamps']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          walker_id: string;
          host_id: string;
          check_in: string;
          check_out: string | null;
          guests: number;
          message: string | null;
          status: 'pending' | 'seen' | 'accepted' | 'declined' | 'cancelled' | 'completed';
          door_code: string | null;
          door_code_type: 'pin' | 'keybox' | 'combo' | null;
          door_code_expires: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'door_code' | 'stamp' | 'booking' | 'system';
          metadata: Record<string, unknown> | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      threads: {
        Row: {
          id: string;
          participant_ids: string[];
          last_message: string | null;
          last_message_at: string | null;
          booking_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['threads']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['threads']['Insert']>;
      };
      moments: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          photo_url: string | null;
          location_name: string | null;
          lat: number | null;
          lng: number | null;
          likes_count: number;
          replies_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['moments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['moments']['Insert']>;
      };
      routes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country: string;
          countries: string[];
          distance_km: number;
          duration_days: number;
          difficulty: 'easy' | 'moderate' | 'challenging';
          description: string;
          hero_image: string | null;
          gpx_url: string | null;
          host_count: number;
          free_host_count: number;
          walker_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['routes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['routes']['Insert']>;
      };
      gaestebuch: {
        Row: {
          id: string;
          host_id: string;
          walker_id: string;
          walker_name: string;
          message: string;
          rating: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gaestebuch']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['gaestebuch']['Insert']>;
      };
      blog_posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          cover_image: string | null;
          location_name: string | null;
          is_published: boolean;
          share_token: string | null;
          word_count: number;
          book_id: string | null;
          chapter_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blog_posts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>;
      };
      presence: {
        Row: {
          id: string;
          profile_id: string;
          lat: number;
          lng: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['presence']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['presence']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// ════════════════════════════════════════════
// DOMAIN TYPES
// ════════════════════════════════════════════

export type StampCategory =
  | 'hospitality' | 'food' | 'culture' | 'nature'
  | 'community' | 'water' | 'adventure' | 'workshops';

export type TierLevel =
  | 'wanderkind' | 'wunderkind' | 'wandersmann' | 'ehrenmann'
  | 'pilger' | 'apostel' | 'lehrer' | 'meister'
  | 'grossmeister' | 'legende' | 'koenig';

export const TIER_THRESHOLDS: Record<TierLevel, number> = {
  wanderkind: 0,
  wunderkind: 1,
  wandersmann: 3,
  ehrenmann: 10,
  pilger: 30,
  apostel: 210,
  lehrer: 365,
  meister: 730,
  grossmeister: 1095,
  legende: 1460,
  koenig: 1825,
};

export type VerificationLevel =
  | 'none'
  | 'self'        // Photo + ID match
  | 'community'   // 3+ hosted confirmations
  | 'association'  // Confraternity / trail org
  | 'wanderkind';  // Personal visit by WK team

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type HostType = 'free' | 'donativo' | 'budget' | 'paid';

export type BookingStatus = 'pending' | 'seen' | 'accepted' | 'declined' | 'cancelled' | 'completed';

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Host = Database['public']['Tables']['hosts']['Row'];
export type Stamp = Database['public']['Tables']['stamps']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Thread = Database['public']['Tables']['threads']['Row'];
export type Moment = Database['public']['Tables']['moments']['Row'];
export type Route = Database['public']['Tables']['routes']['Row'];
export type GuestbookEntry = Database['public']['Tables']['gaestebuch']['Row'];
export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
