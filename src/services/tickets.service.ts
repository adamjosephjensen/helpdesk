import { SupabaseClient } from '@supabase/supabase-js'
import { Ticket, CreateTicketDTO } from './types'

export class TicketsService {
  constructor(private supabase: SupabaseClient) {}

  async createTicket(dto: CreateTicketDTO): Promise<Ticket> {
    try {
      const { data, error } = await this.supabase
        .from('tickets')
        .insert({
          customer_name: dto.customer_name,
          customer_email: dto.customer_email,
          coating_color: dto.coating_color,
          coating_finish: dto.coating_finish,
          // Other fields will be set by DB defaults:
          // - order_number (trigger)
          // - date_received (now())
          // - status ('Order Received')
          // - last_updated (now())
          // - created_at (now())
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating ticket:', error)
      throw error
    }
  }
} 