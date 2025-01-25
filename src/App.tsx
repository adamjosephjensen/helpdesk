import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { TicketsView } from './components/TicketsView'
import { SupabaseTicketRepository } from './repositories/ticketRepository'
import { TicketService } from './services/ticketService'
import { AuthForm } from './components/AuthForm'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [ticketService] = useState(() => {
    const repository = new SupabaseTicketRepository(supabase)
    return new TicketService(repository)
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user) {
    return (
      <div className="container">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <span>Welcome, {user.email}</span>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </div>
      <TicketsView user={user} ticketService={ticketService} />
    </div>
  )
}
