import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export async function signIn(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin
      }
    })
    if (error) throw error
  } catch (error: any) {
    if (error.message?.includes('storage')) {
      throw new Error('Please disable Incognito mode or enable third-party cookies to sign in')
    }
    throw error
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } catch (error: any) {
    if (!error.message?.includes('storage')) {
      throw error
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser()
    return data.user
  } catch (error: any) {
    if (error.message?.includes('storage')) {
      return null
    }
    throw error
  }
}

export type { User } 