import { describe, it, expect, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseTicketRepository } from '../ticketRepository'
import { TicketData } from '../../domain/ticket'

describe('SupabaseTicketRepository', () => {
  describe('create', () => {
    it('creates a ticket with minimal data', async () => {
      const mockResponse = {
        data: {
          id: '1',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          coating_color: 'black',
          coating_finish: 'recommended_gloss',
          order_number: 'CRK-2024-001',
          status: 'Order Received',
          date_received: new Date().toISOString(),
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        error: null
      }

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(mockResponse)
        }),
        channel: vi.fn()
      } as unknown as SupabaseClient

      const repo = new SupabaseTicketRepository(mockSupabase)
      const minimalData: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black'
      }

      const result = await repo.create(minimalData)

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
      expect(result.coating_finish).toBe('recommended_gloss')
    })

    it('preserves explicitly provided coating_finish', async () => {
      const mockResponse = {
        data: {
          id: '1',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          coating_color: 'black',
          coating_finish: 'higher_gloss',
          order_number: 'CRK-2024-001',
          status: 'Order Received',
          date_received: new Date().toISOString(),
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        error: null
      }

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(mockResponse)
        }),
        channel: vi.fn()
      } as unknown as SupabaseClient

      const repo = new SupabaseTicketRepository(mockSupabase)
      const dataWithFinish: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black',
        coating_finish: 'higher_gloss'
      }

      const result = await repo.create(dataWithFinish)
      expect(result.coating_finish).toBe('higher_gloss')
    })

    it('throws error if Supabase returns error', async () => {
      const mockResponse = {
        data: null,
        error: new Error('Database error')
      }

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(mockResponse)
        }),
        channel: vi.fn()
      } as unknown as SupabaseClient

      const repo = new SupabaseTicketRepository(mockSupabase)
      const ticketData: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black'
      }

      await expect(repo.create(ticketData)).rejects.toThrow('Database error')
    })
  })

  describe('delete', () => {
    it('deletes a ticket', async () => {
      const mockResponse = {
        data: null,
        error: null
      }

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue(mockResponse)
        }),
        channel: vi.fn()
      } as unknown as SupabaseClient

      const repo = new SupabaseTicketRepository(mockSupabase)
      await repo.delete('test-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
    })
  })

  describe('getAll', () => {
    it('gets all tickets', async () => {
      const mockTickets = [{
        id: '1',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black',
        coating_finish: 'recommended_gloss',
        order_number: 'CRK-2024-001',
        status: 'Order Received',
        date_received: new Date().toISOString(),
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }]

      const mockResponse = {
        data: mockTickets,
        error: null
      }

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue(mockResponse)
        }),
        channel: vi.fn()
      } as unknown as SupabaseClient

      const repo = new SupabaseTicketRepository(mockSupabase)
      const result = await repo.getAll()

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
      expect(result).toEqual(mockTickets)
    })
  })
}) 