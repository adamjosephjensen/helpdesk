import { describe, it, expect, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseTicketRepository } from '../ticketRepository'
import { TicketData } from '../../domain/ticket'
import { PostgrestBuilder } from '@supabase/postgrest-js'

describe('SupabaseTicketRepository', () => {
  function createMockSupabaseClient() {
    const mockResponse = {
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    }

    const builder = {
      select: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn(() => Promise.resolve(mockResponse)),
      setResponse(response: typeof mockResponse) {
        this.then = vi.fn(() => Promise.resolve(response))
        return this
      }
    }

    return {
      from: vi.fn().mockReturnValue(builder),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }))
    } as unknown as SupabaseClient
  }

  describe('create', () => {
    it('collaborates with Supabase to create a ticket with minimal data', async () => {
      const mockSupabase = createMockSupabaseClient()
      const repo = new SupabaseTicketRepository(mockSupabase)
      
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
      
      const builder = mockSupabase.from('tickets')
      builder.setResponse(mockResponse)

      const minimalData: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black'
      }

      const result = await repo.create(minimalData)

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
      expect(builder.insert).toHaveBeenCalledWith(minimalData)
      expect(result.coating_finish).toBe('recommended_gloss')
    })

    it('preserves explicitly provided coating_finish', async () => {
      const mockSupabase = createMockSupabaseClient()
      const repo = new SupabaseTicketRepository(mockSupabase)
      
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
      
      const builder = mockSupabase.from('tickets')
      builder.setResponse(mockResponse)

      const dataWithFinish: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black',
        coating_finish: 'higher_gloss'
      }

      const result = await repo.create(dataWithFinish)

      expect(builder.insert).toHaveBeenCalledWith(dataWithFinish)
      expect(result.coating_finish).toBe('higher_gloss')
    })

    it('throws error if Supabase returns error', async () => {
      const mockSupabase = createMockSupabaseClient()
      const repo = new SupabaseTicketRepository(mockSupabase)
      
      const builder = mockSupabase.from('tickets')
      builder.setResponse({
        data: null,
        error: new Error('Database error')
      })

      const ticketData: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black'
      }

      await expect(repo.create(ticketData)).rejects.toThrow('Database error')
    })
  })

  describe('delete', () => {
    it('collaborates with Supabase to delete a ticket', async () => {
      const mockSupabase = createMockSupabaseClient()
      const repo = new SupabaseTicketRepository(mockSupabase)
      
      const builder = mockSupabase.from('tickets')
      builder.setResponse({
        data: null,
        error: null
      })

      await repo.delete('test-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
      expect(builder.delete).toHaveBeenCalled()
      expect(builder.eq).toHaveBeenCalledWith('id', 'test-id')
    })
  })

  describe('getAll', () => {
    it('collaborates with Supabase to get all tickets', async () => {
      const mockSupabase = createMockSupabaseClient()
      const repo = new SupabaseTicketRepository(mockSupabase)
      
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

      const builder = mockSupabase.from('tickets')
      builder.setResponse({
        data: mockTickets,
        error: null
      })

      const result = await repo.getAll()

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
      expect(builder.select).toHaveBeenCalled()
      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockTickets)
    })
  })
}) 