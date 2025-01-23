import { supabase } from './supabase'
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

export async function getItems(): Promise<Item[]> {
  try {
    const { data, error } = await supabase.from('items').select('*')
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching items:', error)
    throw error
  }
}

export async function createItem(value: string): Promise<Item[]> {
  try {
    const { data, error } = await supabase
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

export async function updateItem(id: string, value: string): Promise<void> {
  try {
    const { error } = await supabase.from('items').update({ value }).eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error('Error updating item:', error)
    throw error
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error('Error deleting item:', error)
    throw error
  }
}

export async function subscribeToItems(
  handleChange: (payload: ItemPayload) => void
): Promise<{ unsubscribe: () => void }> {
  const channel = supabase
    .channel('items-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'items'
      },
      (payload: RealtimePostgresChangesPayload<Item>) => {
        console.log('Received new item:', payload)
        handleChange({ type: 'INSERT', new: payload.new as Item })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'items'
      },
      (payload: RealtimePostgresChangesPayload<Item>) => {
        console.log('Received updated item:', payload)
        handleChange({ type: 'UPDATE', new: payload.new as Item })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'items'
      },
      (payload: RealtimePostgresChangesPayload<Item>) => {
        console.log('Received deleted item:', payload)
        handleChange({ type: 'DELETE', old: payload.old as Item })
      }
    )
    .subscribe()

  console.log('Subscribed to items changes')
  return {
    unsubscribe: () => {
      try {
        channel.unsubscribe()
        console.log('Unsubscribed from items changes')
      } catch (error) {
        console.error('Error unsubscribing:', error)
      }
    }
  }
} 