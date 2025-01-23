import { SupabaseClient } from '@supabase/supabase-js'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface Item {
  id: string
  value: string
  created_at: string
  // Add any other fields from your Supabase table
}

export type ItemPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Item
  old?: Item
}

export class ItemsService {
  private activeChannel: ReturnType<SupabaseClient['channel']> | null = null

  constructor(private supabase: SupabaseClient) {}

  async getItems(): Promise<Item[]> {
    try {
      const { data, error } = await this.supabase.from('items').select('*')
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching items:', error)
      throw error
    }
  }

  async createItem(value: string): Promise<Item[]> {
    try {
      const { data, error } = await this.supabase
        .from('items')
        .insert({ value })
        .select()
        
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error creating item:', error)
      throw error
    }
  }

  async updateItem(id: string, value: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('items')
        .update({ value })
        .eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('items')
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting item:', error)
      throw error
    }
  }

  subscribeToItems(
    handleChange: (payload: ItemPayload) => void
  ): { unsubscribe: () => void } {
    console.log('Setting up subscription to items...')
    
    if (this.activeChannel) {
      console.log('Cleaning up existing subscription...')
      this.activeChannel.unsubscribe()
      this.activeChannel = null
    }

    const channel = this.supabase.channel('items-changes')
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public',
          table: 'items',
        },
        (payload: RealtimePostgresChangesPayload<Item>) => {
          console.log('Raw event received:', {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            commit_timestamp: payload.commit_timestamp,
            payload
          })
          
          switch (payload.eventType) {
            case 'INSERT':
              console.log('Processing INSERT:', payload.new)
              handleChange({ 
                type: 'INSERT',
                new: payload.new as Item
              })
              break
            
            case 'UPDATE':
              console.log('Processing UPDATE:', payload.new)
              handleChange({ 
                type: 'UPDATE',
                new: payload.new as Item
              })
              break
            
            case 'DELETE':
              console.log('Processing DELETE:', payload.old)
              handleChange({ 
                type: 'DELETE',
                old: payload.old as Item
              })
              break
          }
        }
      )
      .on('system', { event: '*' }, (payload: { [key: string]: any }) => {
        console.log('System event:', payload)
      })

    try {
      channel.subscribe()
      console.log('Subscription status:', channel)
      this.activeChannel = channel

      return {
        unsubscribe: () => {
          try {
            console.log('Unsubscribing from items changes...')
            channel.unsubscribe()
            if (this.activeChannel === channel) {
              this.activeChannel = null
            }
            console.log('Successfully unsubscribed')
          } catch (error) {
            console.error('Error during unsubscribe:', error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to subscribe:', error)
      throw error
    }
  }
} 