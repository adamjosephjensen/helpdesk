import { TicketData, validateTicketCreation } from '../domain/ticket'
import { TicketRepository, Ticket } from '../repositories/ticketRepository'

export class TicketService {
  constructor(private repository: TicketRepository) {}

  async createTicket(data: TicketData): Promise<{ ticket?: Ticket, errors?: string[] }> {
    const validation = validateTicketCreation(data)
    if (!validation.isValid) {
      return { errors: validation.errors }
    }

    const ticket = await this.repository.create(data)
    return { ticket }
  }

  async deleteTicket(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  async getAllTickets(): Promise<Ticket[]> {
    return this.repository.getAll()
  }

  subscribeToTickets(callback: (payload: any) => void) {
    return this.repository.subscribeToTickets(callback)
  }
} 