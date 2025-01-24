import { describe, it, expect, vi } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TicketsService } from '../services/tickets.service'
import { Ticket, CreateTicketDTO } from '../services/types'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockOn = vi.fn().mockReturnThis()
  const mockSubscribe = vi.fn().mockReturnThis()
  
  return {
    createClient: vi.fn((): Partial<SupabaseClient> => ({
      from: vi.fn(() => ({
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        single: vi.fn()
      })),
      channel: vi.fn(() => ({
        on: mockOn,
        subscribe: mockSubscribe
      }))
    }))
  }
})

describe('TicketsService Collaboration Tests', () => {
  describe('createTicket', () => {
    it('collaborates with Supabase to create a ticket with required fields', async () => {
      const mockSupabase = createClient('fake-url', 'fake-key') as SupabaseClient
      const mockTicket: Ticket = {
        id: 'test-uuid',
        order_number: 'CRK-2024-00001',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        date_received: new Date().toISOString(),
        coating_color: 'Midnight Black',
        coating_finish: 'recommended_gloss',
        status: 'Order Received',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      const insertMock = vi.fn().mockResolvedValue({ 
        data: mockTicket, 
        error: null 
      })

      vi.mocked(mockSupabase.from).mockReturnValue({
        ...mockSupabase.from('tickets'),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: insertMock
      } as any)

      const service = new TicketsService(mockSupabase)
      const createTicketDTO: CreateTicketDTO = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'Midnight Black'
        // coating_finish omitted to test default value
      }

      const result = await service.createTicket(createTicketDTO)

      // Verify collaboration
      expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
      expect(insertMock).toHaveBeenCalled()
      expect(result).toEqual(mockTicket)
    })

    it('allows overriding the default coating_finish', async () => {
      const mockSupabase = createClient('fake-url', 'fake-key') as SupabaseClient
      const mockTicket: Ticket = {
        id: 'test-uuid',
        order_number: 'CRK-2024-00002',
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        date_received: new Date().toISOString(),
        coating_color: 'Forest Green',
        coating_finish: 'higher_gloss',
        status: 'Order Received',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      const insertMock = vi.fn().mockResolvedValue({ 
        data: mockTicket, 
        error: null 
      })

      vi.mocked(mockSupabase.from).mockReturnValue({
        ...mockSupabase.from('tickets'),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: insertMock
      } as any)

      const service = new TicketsService(mockSupabase)
      const createTicketDTO: CreateTicketDTO = {
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        coating_color: 'Forest Green',
        coating_finish: 'higher_gloss'
      }

      const result = await service.createTicket(createTicketDTO)

      // Verify the insert was called with the right data
      const insertFn = vi.mocked(mockSupabase.from('tickets').insert)
      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          coating_finish: 'higher_gloss'
        })
      )
      expect(result.coating_finish).toBe('higher_gloss')
    })
  })
})

describe('TicketsService Contract Tests', () => {
  it('creates tickets with the correct shape and default values', async () => {
    const mockSupabase = createClient('fake-url', 'fake-key') as SupabaseClient
    const service = new TicketsService(mockSupabase)
    
    const createTicketDTO: CreateTicketDTO = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      coating_color: 'Midnight Black'
      // coating_finish omitted to test default value
    }

    vi.mocked(mockSupabase.from).mockReturnValue({
      ...mockSupabase.from('tickets'),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-uuid',
          order_number: 'CRK-2024-00001',
          ...createTicketDTO,
          coating_finish: 'recommended_gloss', // Should come from DB default
          status: 'Order Received',
          date_received: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        error: null
      })
    } as any)

    const ticket = await service.createTicket(createTicketDTO)

    // Verify the contract
    expect(ticket).toMatchObject({
      id: expect.any(String),
      order_number: expect.stringMatching(/^CRK-\d{4}-\d{5}$/),
      customer_name: expect.any(String),
      customer_email: expect.any(String),
      date_received: expect.any(String),
      coating_color: expect.any(String),
      coating_finish: 'recommended_gloss', // Explicitly check default value
      status: 'Order Received',
      last_updated: expect.any(String),
      created_at: expect.any(String)
    })
  })
}) 