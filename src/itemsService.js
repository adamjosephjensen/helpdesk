import { supabase } from '../supabase'

export async function getItems() {
  const { data, error } = await supabase.from('items').select('*')
  if (error) throw error
  return data
}

export async function createItem(value) {
  const { error } = await supabase.from('items').insert({ value })
  if (error) throw error
}

export async function updateItem(id, value) {
  const { error } = await supabase.from('items').update({ value }).eq('id', id)
  if (error) throw error
}

export async function subscribeToItems(handleChange) {
  // handleChange is a callback that fetches or sets new data
  const channel = supabase
    .channel('anyUniqueName')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items' },
      (payload) => {
        handleChange(payload)
      }
    )
    .subscribe()

  return channel
}
