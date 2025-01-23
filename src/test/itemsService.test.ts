import { describe, it, expect, vi } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ItemsService } from '../itemsService'

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
        eq: vi.fn()
      })),
      channel: vi.fn(() => ({
        on: mockOn,
        subscribe: mockSubscribe
      }))
    }))
  }
})

describe('ItemsService Collaboration Tests', () => {
  // Test the collaboration between ItemsService and Supabase
  describe('getItems', () => {
    it('collaborates with Supabase to fetch items', async () => {
      const mockItems = [{ id: '1', value: 'test', created_at: new Date().toISOString() }]
      const mockSupabase = createClient('fake-url', 'fake-key') as SupabaseClient
      
      // Setup the mock response
      const selectMock = vi.fn().mockResolvedValue({ data: mockItems, error: null })
      vi.mocked(mockSupabase.from).mockReturnValue({
        ...mockSupabase.from('items'),
        select: selectMock
      } as any)

      // Create a new instance with our mocked client
      const service = new ItemsService(mockSupabase)
      const result = await service.getItems()

      // Verify collaboration
      expect(mockSupabase.from).toHaveBeenCalledWith('items')
      expect(selectMock).toHaveBeenCalled()
      expect(result).toEqual(mockItems)
    })
  })

  describe('subscribeToItems', () => {
    it('sets up a real-time subscription correctly', () => {
      const mockSupabase = createClient('fake-url', 'fake-key') as SupabaseClient
      const handleChange = vi.fn()
      
      // Create service and call subscribe
      const service = new ItemsService(mockSupabase)
      service.subscribeToItems(handleChange)

      // Get the channel mock
      const channelMock = mockSupabase.channel('items-changes')

      // Verify the collaboration with Supabase's real-time features
      expect(mockSupabase.channel).toHaveBeenCalledWith('items-changes')
      expect(channelMock.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'items'
        }),
        expect.any(Function)
      )
      expect(channelMock.subscribe).toHaveBeenCalled()
    })
  })
})

// Contract tests ensure the service fulfills its promises to consumers
describe('ItemsService Contract Tests', () => {
  it('provides items in the correct shape', async () => {
    const mockSupabase = createClient('fake-url', 'fake-key') as SupabaseClient
    const mockItem = {
      id: '1',
      value: 'test',
      created_at: new Date().toISOString()
    }

    vi.mocked(mockSupabase.from).mockReturnValue({
      ...mockSupabase.from('items'),
      select: vi.fn().mockResolvedValue({ data: [mockItem], error: null })
    } as any)

    const service = new ItemsService(mockSupabase)
    const items = await service.getItems()

    // Verify the contract
    expect(items[0]).toMatchObject({
      id: expect.any(String),
      value: expect.any(String),
      created_at: expect.any(String)
    })
  })
}) 