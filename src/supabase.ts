import { createClient } from '@supabase/supabase-js'
import { ItemsService } from './services'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging (safe, doesn't expose full key)
console.log('Supabase URL length:', supabaseUrl?.length)
console.log('Supabase URL starts with:', supabaseUrl?.substring(0, 8))
console.log('Anon key length:', supabaseAnonKey?.length)
console.log('Anon key starts with:', supabaseAnonKey?.substring(0, 8))

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value)
        } catch {
          // Ignore storage errors
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key)
        } catch {
          // Ignore storage errors
        }
      }
    }
  }
})

export const itemsService = new ItemsService(supabase)
