export type CoatingFinish = 'higher_gloss' | 'recommended_gloss' | 'lower_gloss'
export type TicketStatus = 'Order Received' | 'In Progress' | 'Ready for Pickup' | 'Completed'

export interface Ticket {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  date_received: string
  coating_color: string
  coating_finish: CoatingFinish
  status: TicketStatus
  last_updated: string
  created_at: string
}

export interface CreateTicketDTO {
  customer_name: string
  customer_email: string
  coating_color: string
  coating_finish?: CoatingFinish  // Made optional since we have a default value
} 