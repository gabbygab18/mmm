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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string | null
          dismissed: boolean | null
          id: string
          message: string
          read: boolean | null
          related_request_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          message: string
          read?: boolean | null
          related_request_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          message?: string
          read?: boolean | null
          related_request_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          audiences: string[]
          body: string
          created_at: string
          failed_count: number
          id: string
          recipient_count: number
          sent_by_user_id: string
          sent_count: number
          subject: string
        }
        Insert: {
          audiences: string[]
          body: string
          created_at?: string
          failed_count?: number
          id?: string
          recipient_count?: number
          sent_by_user_id: string
          sent_count?: number
          subject: string
        }
        Update: {
          audiences?: string[]
          body?: string
          created_at?: string
          failed_count?: number
          id?: string
          recipient_count?: number
          sent_by_user_id?: string
          sent_count?: number
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_sent_by_user_id_fkey"
            columns: ["sent_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      center_favorite_musicians: {
        Row: {
          center_id: string
          created_at: string | null
          id: string
          musician_id: string
        }
        Insert: {
          center_id: string
          created_at?: string | null
          id?: string
          musician_id: string
        }
        Update: {
          center_id?: string
          created_at?: string | null
          id?: string
          musician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_favorite_musicians_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_favorite_musicians_musician_id_fkey"
            columns: ["musician_id"]
            isOneToOne: false
            referencedRelation: "musicians"
            referencedColumns: ["id"]
          },
        ]
      }
      center_locations: {
        Row: {
          address: string
          center_id: string
          city: string | null
          created_at: string | null
          id: string
          location_image_url: string | null
          name: string
          phone: string | null
          profile_complete: boolean | null
          resident_count: number | null
          state: string | null
          supports_transport: boolean | null
          updated_at: string | null
          username: string | null
          zip_code: string
        }
        Insert: {
          address: string
          center_id: string
          city?: string | null
          created_at?: string | null
          id?: string
          location_image_url?: string | null
          name: string
          phone?: string | null
          profile_complete?: boolean | null
          resident_count?: number | null
          state?: string | null
          supports_transport?: boolean | null
          updated_at?: string | null
          username?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          center_id?: string
          city?: string | null
          created_at?: string | null
          id?: string
          location_image_url?: string | null
          name?: string
          phone?: string | null
          profile_complete?: boolean | null
          resident_count?: number | null
          state?: string | null
          supports_transport?: boolean | null
          updated_at?: string | null
          username?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_locations_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      center_notes: {
        Row: {
          body: string | null
          center_id: string
          created_at: string | null
          created_by_user_id: string
          id: string
          title: string
        }
        Insert: {
          body?: string | null
          center_id: string
          created_at?: string | null
          created_by_user_id: string
          id?: string
          title: string
        }
        Update: {
          body?: string | null
          center_id?: string
          created_at?: string | null
          created_by_user_id?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_notes_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      center_request_dates: {
        Row: {
          center_location_id: string
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          requested_date: string
          start_time: string
        }
        Insert: {
          center_location_id: string
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          requested_date: string
          start_time?: string
        }
        Update: {
          center_location_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          requested_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_request_dates_center_location_id_fkey"
            columns: ["center_location_id"]
            isOneToOne: false
            referencedRelation: "center_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          about_description: string | null
          approved: boolean | null
          community_type: string | null
          confirmed: boolean
          confirmed_at: string | null
          confirmed_by_user_id: string | null
          created_at: string | null
          deleted_at: string | null
          director_email: string | null
          director_first_name: string | null
          director_job_title: string | null
          director_last_name: string | null
          director_phone: string | null
          established_year: number | null
          highlights: string[]
          id: string
          name: string
          performance_location: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_days: string[] | null
          preferred_length: string | null
          preferred_music_styles: string[]
          preferred_performance_types: string[]
          preferred_time: string | null
          profile_complete: boolean | null
          profile_image_url: string | null
          resident_count: number | null
          scheduling_notes: string | null
          testimonial_author: string | null
          testimonial_quote: string | null
          updated_at: string | null
          user_id: string
          username: string
          visit_frequency: string | null
          website: string | null
        }
        Insert: {
          about_description?: string | null
          approved?: boolean | null
          community_type?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          director_email?: string | null
          director_first_name?: string | null
          director_job_title?: string | null
          director_last_name?: string | null
          director_phone?: string | null
          established_year?: number | null
          highlights?: string[]
          id?: string
          name: string
          performance_location?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_days?: string[] | null
          preferred_length?: string | null
          preferred_music_styles?: string[]
          preferred_performance_types?: string[]
          preferred_time?: string | null
          profile_complete?: boolean | null
          profile_image_url?: string | null
          resident_count?: number | null
          scheduling_notes?: string | null
          testimonial_author?: string | null
          testimonial_quote?: string | null
          updated_at?: string | null
          user_id: string
          username?: string
          visit_frequency?: string | null
          website?: string | null
        }
        Update: {
          about_description?: string | null
          approved?: boolean | null
          community_type?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          director_email?: string | null
          director_first_name?: string | null
          director_job_title?: string | null
          director_last_name?: string | null
          director_phone?: string | null
          established_year?: number | null
          highlights?: string[]
          id?: string
          name?: string
          performance_location?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_days?: string[] | null
          preferred_length?: string | null
          preferred_music_styles?: string[]
          preferred_performance_types?: string[]
          preferred_time?: string | null
          profile_complete?: boolean | null
          profile_image_url?: string | null
          resident_count?: number | null
          scheduling_notes?: string | null
          testimonial_author?: string | null
          testimonial_quote?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          visit_frequency?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centers_confirmed_by_user_id_fkey"
            columns: ["confirmed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          full_name: string
          handled: boolean
          handled_at: string | null
          handled_by: string | null
          id: string
          inquiry_type: string
          message: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          inquiry_type: string
          message: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          inquiry_type?: string
          message?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_inquiries_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media: {
        Row: {
          created_at: string
          created_by_admin_user_id: string
          id: string
          label_override: string | null
          published: boolean
          request_id: string
          updated_at: string
          updated_by_admin_user_id: string | null
          youtube_url: string
        }
        Insert: {
          created_at?: string
          created_by_admin_user_id: string
          id?: string
          label_override?: string | null
          published?: boolean
          request_id: string
          updated_at?: string
          updated_by_admin_user_id?: string | null
          youtube_url: string
        }
        Update: {
          created_at?: string
          created_by_admin_user_id?: string
          id?: string
          label_override?: string | null
          published?: boolean
          request_id?: string
          updated_at?: string
          updated_by_admin_user_id?: string | null
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_created_by_admin_user_id_fkey"
            columns: ["created_by_admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_updated_by_admin_user_id_fkey"
            columns: ["updated_by_admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          center_id: string | null
          created_at: string
          created_by_admin_user_id: string
          id: string
          musician_id: string | null
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_admin_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          created_by_admin_user_id: string
          id?: string
          musician_id?: string | null
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          created_by_admin_user_id?: string
          id?: string
          musician_id?: string | null
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_created_by_admin_user_id_fkey"
            columns: ["created_by_admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_musician_id_fkey"
            columns: ["musician_id"]
            isOneToOne: false
            referencedRelation: "musicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_resolved_by_admin_user_id_fkey"
            columns: ["resolved_by_admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      musician_availability_dates: {
        Row: {
          available_date: string
          created_at: string | null
          end_time: string
          id: string
          musician_id: string
          notes: string | null
          start_time: string
        }
        Insert: {
          available_date: string
          created_at?: string | null
          end_time: string
          id?: string
          musician_id: string
          notes?: string | null
          start_time: string
        }
        Update: {
          available_date?: string
          created_at?: string | null
          end_time?: string
          id?: string
          musician_id?: string
          notes?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "musician_availability_dates_musician_id_fkey"
            columns: ["musician_id"]
            isOneToOne: false
            referencedRelation: "musicians"
            referencedColumns: ["id"]
          },
        ]
      }
      musicians: {
        Row: {
          approved: boolean | null
          band_size_preference: string | null
          bio: string | null
          compensation_preference: string | null
          created_at: string | null
          deleted_at: string | null
          first_name: string | null
          general_available_days: string[] | null
          has_own_transport: boolean | null
          id: string
          instruments: string[] | null
          last_name: string | null
          music_types: string[] | null
          name: string
          phone: string | null
          profile_complete: boolean | null
          profile_image_url: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          travel_radius_miles: number | null
          unavailable_dates: string[]
          updated_at: string | null
          user_id: string
          username: string
          website_url: string | null
          willing_to_travel: boolean | null
          youtube_channel_url: string | null
          zip_code: string
        }
        Insert: {
          approved?: boolean | null
          band_size_preference?: string | null
          bio?: string | null
          compensation_preference?: string | null
          created_at?: string | null
          deleted_at?: string | null
          first_name?: string | null
          general_available_days?: string[] | null
          has_own_transport?: boolean | null
          id?: string
          instruments?: string[] | null
          last_name?: string | null
          music_types?: string[] | null
          name: string
          phone?: string | null
          profile_complete?: boolean | null
          profile_image_url?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          travel_radius_miles?: number | null
          unavailable_dates?: string[]
          updated_at?: string | null
          user_id: string
          username?: string
          website_url?: string | null
          willing_to_travel?: boolean | null
          youtube_channel_url?: string | null
          zip_code: string
        }
        Update: {
          approved?: boolean | null
          band_size_preference?: string | null
          bio?: string | null
          compensation_preference?: string | null
          created_at?: string | null
          deleted_at?: string | null
          first_name?: string | null
          general_available_days?: string[] | null
          has_own_transport?: boolean | null
          id?: string
          instruments?: string[] | null
          last_name?: string | null
          music_types?: string[] | null
          name?: string
          phone?: string | null
          profile_complete?: boolean | null
          profile_image_url?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          travel_radius_miles?: number | null
          unavailable_dates?: string[]
          updated_at?: string | null
          user_id?: string
          username?: string
          website_url?: string | null
          willing_to_travel?: boolean | null
          youtube_channel_url?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          body: string
          bounce_status: string | null
          email_to: string
          id: string
          related_request_id: string | null
          sent_at: string | null
          subject: string
          user_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          body: string
          bounce_status?: string | null
          email_to: string
          id?: string
          related_request_id?: string | null
          sent_at?: string | null
          subject: string
          user_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          body?: string
          bounce_status?: string | null
          email_to?: string
          id?: string
          related_request_id?: string | null
          sent_at?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_contacts: {
        Row: {
          director_phone: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          director_phone?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          director_phone?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_status_history: {
        Row: {
          changed_by_user_id: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["request_status"]
          old_status: Database["public"]["Enums"]["request_status"] | null
          reason: string | null
          request_id: string
        }
        Insert: {
          changed_by_user_id: string
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["request_status"]
          old_status?: Database["public"]["Enums"]["request_status"] | null
          reason?: string | null
          request_id: string
        }
        Update: {
          changed_by_user_id?: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["request_status"]
          old_status?: Database["public"]["Enums"]["request_status"] | null
          reason?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_status_history_changed_by_user_id_fkey"
            columns: ["changed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_time_proposals: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          proposal_status: string
          proposed_by_user_id: string
          proposed_date: string
          proposed_end_time: string
          proposed_start_time: string
          request_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          proposal_status?: string
          proposed_by_user_id: string
          proposed_date: string
          proposed_end_time: string
          proposed_start_time: string
          request_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          proposal_status?: string
          proposed_by_user_id?: string
          proposed_date?: string
          proposed_end_time?: string
          proposed_start_time?: string
          request_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_time_proposals_proposed_by_user_id_fkey"
            columns: ["proposed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          center_location_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          initiator_role: Database["public"]["Enums"]["user_role"]
          matched_at: string | null
          musician_id: string | null
          notes: string | null
          requested_date: string
          requested_end_time: string | null
          requested_start_time: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          center_location_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          initiator_role: Database["public"]["Enums"]["user_role"]
          matched_at?: string | null
          musician_id?: string | null
          notes?: string | null
          requested_date: string
          requested_end_time?: string | null
          requested_start_time?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          center_location_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          initiator_role?: Database["public"]["Enums"]["user_role"]
          matched_at?: string | null
          musician_id?: string | null
          notes?: string | null
          requested_date?: string
          requested_end_time?: string | null
          requested_start_time?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_center_location_id_fkey"
            columns: ["center_location_id"]
            isOneToOne: false
            referencedRelation: "center_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_musician_id_fkey"
            columns: ["musician_id"]
            isOneToOne: false
            referencedRelation: "musicians"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      site_options: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_notifications_enabled: boolean
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_notifications_enabled?: boolean
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_notifications_enabled?: boolean
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      zip_centroids: {
        Row: {
          city: string | null
          created_at: string | null
          latitude: number
          longitude: number
          state: string | null
          zip_code: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          latitude: number
          longitude: number
          state?: string | null
          zip_code: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          latitude?: number
          longitude?: number
          state?: string | null
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_alert_for_user: {
        Args: {
          p_alert_type: Database["public"]["Enums"]["alert_type"]
          p_message: string
          p_related_request_id?: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      find_booking_conflicts: {
        Args: {
          p_date: string
          p_end_time: string
          p_exclude_request_id?: string
          p_musician_id: string
          p_start_time: string
        }
        Returns: {
          conflict_end_time: string
          conflict_start_time: string
        }[]
      }
      get_distance_miles: {
        Args: { zip1: string; zip2: string }
        Returns: number
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_nearby_center_request_slots_for_musician: {
        Args: { days_ahead?: number; result_limit?: number }
        Returns: {
          center_id: string
          center_name: string
          distance_miles: number
          end_time: string
          location_id: string
          location_name: string
          location_zip_code: string
          notes: string
          requested_date: string
          start_time: string
        }[]
      }
      get_nearby_center_request_slots_for_musician_with_expansion: {
        Args: {
          days_ahead?: number
          radius_boost_miles?: number
          result_limit?: number
        }
        Returns: {
          center_id: string
          center_name: string
          distance_miles: number
          end_time: string
          location_id: string
          location_name: string
          location_zip_code: string
          notes: string
          requested_date: string
          start_time: string
        }[]
      }
      get_nearby_centers_for_musician: {
        Args: { result_limit?: number }
        Returns: {
          center_id: string
          center_name: string
          center_profile_image_url: string
          distance_miles: number
          location_id: string
          location_image_url: string
          location_name: string
          location_zip_code: string
          resident_count: number
          supports_transport: boolean
        }[]
      }
      get_nearby_centers_for_musician_with_expansion: {
        Args: { radius_boost_miles?: number; result_limit?: number }
        Returns: {
          center_id: string
          center_name: string
          center_profile_image_url: string
          distance_miles: number
          location_id: string
          location_image_url: string
          location_name: string
          location_zip_code: string
          resident_count: number
          supports_transport: boolean
        }[]
      }
      get_nearby_musician_availability_slots_for_center: {
        Args: {
          days_ahead?: number
          result_limit?: number
          target_location_id: string
        }
        Returns: {
          available_date: string
          distance_miles: number
          end_time: string
          musician_id: string
          musician_name: string
          musician_zip_code: string
          notes: string
          start_time: string
        }[]
      }
      get_nearby_musician_slots_for_center_with_expansion: {
        Args: {
          days_ahead?: number
          radius_boost_miles?: number
          result_limit?: number
          target_location_id: string
        }
        Returns: {
          available_date: string
          distance_miles: number
          end_time: string
          musician_id: string
          musician_name: string
          musician_zip_code: string
          notes: string
          start_time: string
        }[]
      }
      get_nearby_musicians_for_center: {
        Args: { result_limit?: number; target_location_id: string }
        Returns: {
          band_size_preference: string
          compensation_preference: string
          distance_miles: number
          general_available_days: string[]
          has_own_transport: boolean
          instruments: string[]
          music_types: string[]
          musician_id: string
          musician_name: string
          musician_zip_code: string
          profile_image_url: string
          willing_to_travel: boolean
        }[]
      }
      is_location_username_available: {
        Args: { p_exclude_location_id?: string; p_username: string }
        Returns: boolean
      }
      is_musician_date_blocked: {
        Args: { p_date: string; p_musician_id: string }
        Returns: boolean
      }
      is_profile_username_available: {
        Args: {
          p_exclude_user_id?: string
          p_profile_type: string
          p_username: string
        }
        Returns: boolean
      }
      musician_display_name: {
        Args: { p_first: string; p_full: string; p_last: string }
        Returns: string
      }
      users_are_connected: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_type:
        | "request_initiated"
        | "request_accepted"
        | "request_cancelled"
        | "proposal_suggested"
        | "event_completed"
        | "event_cancelled"
        | "account_approved"
        | "application_received"
        | "facility_confirmed"
        | "password_changed"
        | "account_deleted"
        | "admin_broadcast"
      request_status:
        | "initiated"
        | "matched"
        | "accepted"
        | "completed"
        | "cancelled"
      user_role: "musician" | "center_coordinator" | "admin"
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
      alert_type: [
        "request_initiated",
        "request_accepted",
        "request_cancelled",
        "proposal_suggested",
        "event_completed",
        "event_cancelled",
        "account_approved",
        "application_received",
        "facility_confirmed",
        "password_changed",
        "account_deleted",
        "admin_broadcast",
      ],
      request_status: [
        "initiated",
        "matched",
        "accepted",
        "completed",
        "cancelled",
      ],
      user_role: ["musician", "center_coordinator", "admin"],
    },
  },
} as const
