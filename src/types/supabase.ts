export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dock_events: {
        Row: {
          acked_at: string | null
          created_at: string | null
          dock_no: number
          dock_set_id: number
          id: string
          status: string
        }
        Insert: {
          acked_at?: string | null
          created_at?: string
          dock_no: number
          dock_set_id: number
          id?: string
          status?: string
        }
        Update: {
          acked_at?: string | null
          created_at?: string | null
          dock_no?: number
          dock_set_id?: number
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dock_events_dock_set_id_fkey"
            columns: ["dock_set_id"]
            isOneToOne: false
            referencedRelation: "dock_sets"
            referencedColumns: ["id"]
          }
        ]
      }
      dock_sets: {
        Row: {
          dock_from: number
          dock_to: number
          id: number
          name: string
        }
        Insert: {
          dock_from: number
          dock_to: number
          id?: number
          name: string
        }
        Update: {
          dock_from?: number
          dock_to?: number
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}