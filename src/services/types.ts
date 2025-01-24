import { User as SupabaseUser } from '@supabase/supabase-js'

export interface Item {
  id: string
  value: string
  created_at: string
}

export type ItemPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Item
  old?: Item
}

export type User = SupabaseUser

export type { CoatingFinish, TicketStatus, Ticket, CreateTicketDTO } from '../types/ticket' 