import { SupabaseClient } from '@supabase/supabase-js'
import { TicketData } from '../domain/ticket'
import { Ticket } from '../types/ticket'

export interface TicketRepository {
  create(data: TicketData): Promise<Ticket>
  update(id: string, data: Partial<Ticket>): Promise<Ticket>
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

  async update(id: string, data: Partial<Ticket>): Promise<Ticket> {
    const { data: ticket, error } = await this.supabase
      .from('tickets')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return ticket
  }

  async getAll(): Promise<Ticket[]> {
    console.log('Repository: Fetching all tickets')
    const { data: tickets, error } = await this.supabase
      .from('tickets')
      .select()
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Repository: Error fetching tickets:', error)
      throw error
    }
    console.log('Repository: Fetched tickets:', tickets)
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
    console.log('Repository: Setting up ticket subscription')
    try {
      const channel = this.supabase.channel('tickets-channel')
      
      const subscription = channel
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'tickets' 
          }, 
          (payload) => {
            console.log('Repository: Received realtime update:', payload)
            try {
              callback(payload)
            } catch (error) {
              console.error('Error in subscription callback:', error)
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
        })

      return {
        unsubscribe: () => {
          console.log('Repository: Unsubscribing from tickets')
          try {
            subscription.unsubscribe()
          } catch (error) {
            console.error('Error unsubscribing:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error setting up subscription:', error)
      return {
        unsubscribe: () => console.log('No-op unsubscribe due to setup failure')
      }
    }
  }
} 