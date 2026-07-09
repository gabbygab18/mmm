export type Database = {
  public: {
    Enums: {
      alert_type:
        | 'request_initiated'
        | 'request_accepted'
        | 'request_cancelled'
        | 'proposal_suggested'
        | 'event_completed'
        | 'event_cancelled'
      request_status: 'initiated' | 'matched' | 'accepted' | 'completed' | 'cancelled'
    }
    Tables: {
      alerts: {
        Row: {
          id: string
          user_id: string
          alert_type: Database['public']['Enums']['alert_type']
          title: string
          message: string
          related_request_id: string | null
          read: boolean
          dismissed: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
