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
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
      }
      inventory_items: {
        Row: {
          id: string
          category_id: string
          name: string
          model: string | null
          serial_number: string | null
          status: 'available' | 'rented' | 'maintenance' | 'retired'
          condition: 'new' | 'good' | 'fair' | 'poor'
          purchase_date: string | null
          purchase_price: number | null
          daily_rental_price: number
          location: string | null
          notes: string | null
          minimum_stock: number
          current_stock: number
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          model?: string | null
          serial_number?: string | null
          status: 'available' | 'rented' | 'maintenance' | 'retired'
          condition: 'new' | 'good' | 'fair' | 'poor'
          purchase_date?: string | null
          purchase_price?: number | null
          daily_rental_price: number
          location?: string | null
          notes?: string | null
          minimum_stock?: number
          current_stock?: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          model?: string | null
          serial_number?: string | null
          status?: 'available' | 'rented' | 'maintenance' | 'retired'
          condition?: 'new' | 'good' | 'fair' | 'poor'
          purchase_date?: string | null
          purchase_price?: number | null
          daily_rental_price?: number
          location?: string | null
          notes?: string | null
          minimum_stock?: number
          current_stock?: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
      }
      // Add other table types as needed
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}