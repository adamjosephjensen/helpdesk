import { SupabaseClient } from '@supabase/supabase-js'
import { TicketData } from '../domain/ticket'

export interface Ticket extends TicketData {
  id: string
  order_number: string
  date_received: string
  status: string
  last_updated: string
  created_at: string
}

export interface TicketRepository {
  create(data: TicketData): Promise<Ticket>
  getAll(): Promise<Ticket[]>
  delete(id: string): Promise<void>
  subscribeToTickets(callback: (payload: any) => void): { unsubscribe: () => void }
}

export class SupabaseTicketRepository implements TicketRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: TicketData): Promise<Ticket> {
    const { data: ticket, error } = await this.supabase
      .from('tickets')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return ticket
  }

  async getAll(): Promise<Ticket[]> {
    const { data: tickets, error } = await this.supabase
      .from('tickets')
      .select()
      .order('created_at', { ascending: false })

    if (error) throw error
    return tickets || []
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  subscribeToTickets(callback: (payload: any) => void) {
    const subscription = this.supabase
      .channel('tickets')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        callback
      )
      .subscribe()

    return {
      unsubscribe: () => {
        subscription.unsubscribe()
      }
    }
  }
} 