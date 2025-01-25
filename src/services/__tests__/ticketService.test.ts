import { describe, it, expect, vi } from 'vitest'
import { TicketService } from '../ticketService'
import { TicketRepository } from '../../repositories/ticketRepository'
import { TicketData } from '../../domain/ticket'
import { Ticket, TicketStatus } from '../../types/ticket'

describe('TicketService', () => {
  const mockTicket: Ticket = {
    id: 'test-id',
    order_number: 'CRK-2024-00001',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    coating_color: 'black',
    coating_finish: 'recommended_gloss',
    date_received: new Date().toISOString(),
    status: 'Order Received',
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  }

  function createMockRepository(): TicketRepository {
    return {
      create: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
      update: vi.fn(),
      subscribeToTickets: vi.fn()
    }
  }

  describe('createTicket', () => {
    it('validates data before creating ticket', async () => {
      const mockRepo = createMockRepository()
      const service = new TicketService(mockRepo)
      
      const invalidData: Partial<TicketData> = {
        customer_name: '',  // Invalid: empty name
        customer_email: 'john@example.com',
        coating_color: 'black'
      }

      const result = await service.createTicket(invalidData as TicketData)

      expect(result.errors).toBeDefined()
      expect(result.errors).toContain('Customer name is required')
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('creates ticket when data is valid', async () => {
      const mockRepo = createMockRepository()
      vi.mocked(mockRepo.create).mockResolvedValue(mockTicket)
      const service = new TicketService(mockRepo)
      
      const validData: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black'
      }

      const result = await service.createTicket(validData)

      expect(result.errors).toBeUndefined()
      expect(result.ticket).toEqual(mockTicket)
      expect(mockRepo.create).toHaveBeenCalledWith(validData)
    })
  })

  describe('deleteTicket', () => {
    it('delegates deletion to repository', async () => {
      const mockRepo = createMockRepository()
      const service = new TicketService(mockRepo)
      
      await service.deleteTicket('test-id')

      expect(mockRepo.delete).toHaveBeenCalledWith('test-id')
    })
  })

  describe('getAllTickets', () => {
    it('delegates fetching to repository', async () => {
      const mockRepo = createMockRepository()
      vi.mocked(mockRepo.getAll).mockResolvedValue([mockTicket])
      const service = new TicketService(mockRepo)
      
      const tickets = await service.getAllTickets()

      expect(mockRepo.getAll).toHaveBeenCalled()
      expect(tickets).toEqual([mockTicket])
    })
  })

  describe('update', () => {
    it('updates ticket status', async () => {
      const mockRepo = createMockRepository()
      const service = new TicketService(mockRepo)
      
      const ticket = { ...mockTicket, status: 'Order Received' }
      vi.mocked(mockRepo.update).mockResolvedValue({
        ...ticket,
        status: 'In Progress',
        last_updated: new Date().toISOString()
      })

      const result = await service.update(ticket.id, { status: 'In Progress' })

      expect(result.status).toBe('In Progress')
      expect(mockRepo.update).toHaveBeenCalledWith(ticket.id, {
        status: 'In Progress'
      })
    })

    it('updates other ticket fields', async () => {
      const mockRepo = createMockRepository()
      const service = new TicketService(mockRepo)
      
      const updates = {
        customer_name: 'Jane Doe',
        coating_color: 'red'
      }

      vi.mocked(mockRepo.update).mockResolvedValue({
        ...mockTicket,
        ...updates,
        last_updated: new Date().toISOString()
      })

      const result = await service.update(mockTicket.id, updates)

      expect(result.customer_name).toBe('Jane Doe')
      expect(result.coating_color).toBe('red')
      expect(mockRepo.update).toHaveBeenCalledWith(mockTicket.id, updates)
    })
  })
}) 