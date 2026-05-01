// Supabase Database Types — WANDERKIND V6.0
// These types define the complete data model for all 121 screens.
// IMPORTANT: Row types are defined as standalone interfaces to avoid
// self-referential type resolution issues with the Supabase SDK.

// ════════════════════════════════════════════
// DOMAIN TYPES (must be defined first — used in Row types)
// ════════════════════════════════════════════

export type StampCategory =
  | 'hospitality' | 'food' | 'culture' | 'nature'
  | 'community' | 'water' | 'adventure' | 'workshops' | 'mountains';

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
  | 'self'              // Legacy: Self-declared
  | 'community'         // Legacy: 3+ hosted confirmations
  | 'association'       // Legacy: Confraternity / trail org
  | 'wanderkind'        // Legacy: Personal visit by WK team
  | 'email'             // Stage 1: Email verified
  | 'biometric_pending' // Stage 2: Biometric under review
  | 'biometric'         // Stage 2: Biometric verified
  | 'document_pending'  // Stage 3: Document under review
  | 'document';         // Stage 3: Document verified (full)

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type HostType = 'free' | 'donativo' | 'budget' | 'paid';

export type BookingStatus = 'pending' | 'seen' | 'accepted' | 'declined' | 'cancelled' | 'completed';

// ════════════════════════════════════════════
// STANDALONE ROW TYPES
// ════════════════════════════════════════════

export interface ProfileRow {
  id: string;
  trail_name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  gallery: string[];
  gallery_urls: string[];
  role: 'walker' | 'host' | 'both';
  tier: TierLevel;
  nights_walked: number;
  stamps_count: number;
  hosts_stayed: number;
  is_walking: boolean;
  is_verified: boolean;
  verification_level: VerificationLevel;
  language: string;
  languages: string[];
  theme: 'light' | 'dark' | 'system';
  ghost_presence: boolean;
  searchable: boolean;
  quiet_mode: boolean;
  skills: string[];
  emergency_contacts: EmergencyContact[];
  // Location
  lat: number | null;
  lng: number | null;
  home_country: string | null;
  // Hosting
  is_hosting: boolean;
  hosting_snoozed: boolean;
  hosting_snoozed_until: string | null;
  hosting_project_title: string | null;
  hosting_project_desc: string | null;
  nights_hosted: number;
  guests_count: number;
  total_hosted: number;
  host_rating: number | null;
  hosting_rating: number | null;
  response_time: string | null;
  host_cover_url: string | null;
  host_address: string | null;
  host_bed_type: string | null;
  host_bio: string | null;
  is_host: boolean;
  // Privacy
  show_location: boolean;
  show_walking_status: boolean;
  show_stats: boolean;
  show_profile_public: boolean;
  allow_messages_from: 'everyone' | 'verified' | 'nobody';
  show_on_map: boolean;
  show_in_search: boolean;
  // Passport / identity fields
  surname: string | null;
  given_names: string | null;
  date_of_birth: string | null;
  sex: string | null;
  nationality: string | null;
  walking_experience: string | null;
  // Pass stats
  stamps_collected: number;
  meals_shared: number;
  donativo_contributions: number;
  water_sources_shared: number;
  fountains_marked: number;
  // Way
  current_way: string | null;
  // Mobility
  mobility_type: 'walk' | 'cycle' | 'run' | null;
  // Identity
  wanderkind_id: string | null;
  // Personal stamp
  personal_stamp: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface HostRow {
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
  host_type:
    | 'free' | 'donativo' | 'budget' | 'paid'
    | 'albergue_municipal' | 'albergue_privado' | 'albergue_parroquial' | 'albergue_asociacion'
    | 'monastery' | 'church' | 'gite_etape' | 'refuge'
    | 'camping' | 'pension' | 'hotel_budget' | 'private_host'
    | 'tourist_info' | 'community';
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
  quality_score?: number;
  category?: 'free' | 'donativo' | 'budget' | null;
  labels?: string[];
  hidden_from_map?: boolean;
  rating: number | null;
  route_id: string | null;
  route_km: number | null;
  is_bicycle_friendly: boolean;
  is_family_friendly: boolean;
  is_women_verified: boolean;
  is_wheelchair_accessible: boolean;
  created_at: string;
  updated_at: string;
  // Import pipeline fields
  data_source: string | null;
  source_id: string | null;
  source_url: string | null;
  last_imported_at: string | null;
  country: string | null;
  region: string | null;
  opening_months: string[] | null;
  languages: string[] | null;
  is_pilgrim_only: boolean;
  avg_response_minutes: number | null;
  last_confirmed: string | null;
}

export interface StampRow {
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
}

export interface BookingRow {
  id: string;
  walker_id: string;
  host_id: string;
  start_date: string;
  end_date: string | null;
  guests: number;
  message: string | null;
  status: 'pending' | 'seen' | 'accepted' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  door_code: string | null;
  door_code_type: 'pin' | 'keybox' | 'combo' | null;
  door_code_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'door_code' | 'stamp' | 'booking' | 'system';
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface ThreadRow {
  id: string;
  participant_ids: string[];
  last_message: string | null;
  last_message_at: string | null;
  booking_id: string | null;
  created_at: string;
}

export interface MomentRow {
  id: string;
  author_id: string;
  content: string;
  photo_url: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface RouteRow {
  id: string;
  name: string;
  slug: string;
  country: string;
  countries: string[];
  distance_km: number;
  duration_days: number;
  difficulty: 'easy' | 'moderate' | 'challenging' | 'expert';
  description: string;
  hero_image: string | null;
  gpx_url: string | null;
  host_count: number;
  free_host_count: number;
  walker_count: number;
  created_at: string;
}

export interface GaestebuchRow {
  id: string;
  host_id: string;
  walker_id: string;
  walker_name: string;
  message: string;
  rating: number | null;
  created_at: string;
}

export interface BlogPostRow {
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
}

export interface PresenceRow {
  id: string;
  profile_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

export interface HostReportRow {
  id: string;
  host_id: string | null;
  reporter_id: string | null;
  report_type: string;
  note: string | null;
  created_at: string;
}

export interface UserReportRow {
  id: string;
  reported_user_id: string | null;
  reporter_id: string | null;
  reason: string;
  description: string | null;
  created_at: string;
}

export interface GroupThreadRow {
  id: string;
  name: string;
  participant_ids: string[];
  created_at: string;
}

export interface HostListingRow {
  id: string;
  host_id: string;
  title: string;
  description: string;
  host_type:
    | 'free' | 'donativo' | 'budget' | 'paid'
    | 'albergue_municipal' | 'albergue_privado' | 'albergue_parroquial' | 'albergue_asociacion'
    | 'monastery' | 'church' | 'gite_etape' | 'refuge'
    | 'camping' | 'pension' | 'hotel_budget' | 'private_host'
    | 'tourist_info' | 'community';
  max_guests: number;
  capacity: number;
  location: string;
  rating: number;
  reviews_count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryRow {
  id: string;
  author_id: string;
  photo_url: string;
  caption: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  expires_at: string; // created_at + 11h 11m
  created_at: string;
}

export interface StoryHighlightRow {
  id: string;
  profile_id: string;
  name: string;
  cover_url: string | null;
  story_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface GaestebuchEntryRow {
  id: string;
  host_id: string;
  guest_name: string;
  guest_avatar: string | null;
  message: string;
  rating: number;
  date: string;
  location: string;
  created_at: string;
}

export interface BlockedUserRow {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface RideRow {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  driver_note: string;
  distance_km: number | null;
  created_at: string;
}


export interface ShuffleRequestRow {
  id: string;
  requester_id: string;
  // Denormalized snapshot of the requester's profile
  trail_name: string;
  nights_walked: number;
  tier: string;
  bio: string | null;
  avatar_url: string | null;
  // Location at time of request
  lat: number | null;
  lng: number | null;
  radius_km: number;
  // Status: pending → matched | expired | cancelled
  status: 'pending' | 'matched' | 'expired' | 'cancelled';
  // Set by the accepting host
  matched_host_id: string | null;
  matched_profile_id: string | null;
  matched_host_name: string | null;
  matched_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface FavoriteHostRow {
  id: string;
  user_id: string;
  host_id: string;
  created_at: string;
}

// ════════════════════════════════════════════
// DATABASE TYPE (references standalone Row types)
// ════════════════════════════════════════════
// Insert/Update use Record<string, any> to avoid TypeScript type instantiation
// limits with Supabase SDK v2's deep generic inference chain across 18 tables.
// Row types remain fully typed for type-safe reads. Supabase validates mutations
// at the database level via RLS and column constraints.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      hosts: {
        Row: HostRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      stamps: {
        Row: StampRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      threads: {
        Row: ThreadRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      moments: {
        Row: MomentRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      routes: {
        Row: RouteRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      gaestebuch: {
        Row: GaestebuchRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      blog_posts: {
        Row: BlogPostRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      presence: {
        Row: PresenceRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      host_reports: {
        Row: HostReportRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      user_reports: {
        Row: UserReportRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      group_threads: {
        Row: GroupThreadRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      host_listings: {
        Row: HostListingRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      gaestebuch_entries: {
        Row: GaestebuchEntryRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      stories: {
        Row: StoryRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      story_highlights: {
        Row: StoryHighlightRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      blocked_users: {
        Row: BlockedUserRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      rides: {
        Row: RideRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      shuffle_requests: {
        Row: ShuffleRequestRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      favorite_hosts: {
        Row: FavoriteHostRow;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience type aliases
export type Profile = ProfileRow;
export type Host = HostRow;
export type Stamp = StampRow;
export type Booking = BookingRow;
export type Message = MessageRow;
export type Thread = ThreadRow;
export type Moment = MomentRow;
export type Route = RouteRow;
export type GuestbookEntry = GaestebuchRow;
export type BlogPost = BlogPostRow;
