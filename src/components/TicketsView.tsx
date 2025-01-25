import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { TicketService } from '../services/ticketService'
import { TicketData, CoatingFinish } from '../domain/ticket'
import { Ticket } from '../types/ticket'
import { KanbanBoard } from './KanbanBoard'
import './KanbanBoard.css'

interface TicketsViewProps {
  user: User
  ticketService: TicketService
}

interface FormErrors {
  customer_name?: string
  customer_email?: string
  coating_color?: string
}

export function TicketsView({ user, ticketService }: TicketsViewProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [formData, setFormData] = useState<TicketData>({
    customer_name: '',
    customer_email: '',
    coating_color: '',
    coating_finish: 'recommended_gloss'
  })
  const [errors, setErrors] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    console.log('TicketsView mounted')
    let mounted = true

    // Initial load
    const loadInitialTickets = async () => {
      try {
        console.log('Loading tickets...')
        const tickets = await ticketService.getAllTickets()
        console.log('Tickets loaded:', tickets)
        if (mounted) {
          setTickets(tickets)
        }
      } catch (error) {
        console.error('Error loading tickets:', error)
        if (mounted) {
          setErrors([error instanceof Error ? error.message : 'Failed to load tickets'])
        }
      }
    }

    loadInitialTickets()

    // Set up subscription
    const subscription = ticketService.subscribeToTickets((payload) => {
      if (!mounted) return
      
      console.log('Received ticket update:', payload)
      setTickets(currentTickets => {
        try {
          console.log('Current tickets before update:', currentTickets)
          const { eventType, new: newRecord, old: oldRecord } = payload
          
          switch (eventType) {
            case 'INSERT': {
              if (!newRecord) return currentTickets
              // Check if we already have this ticket
              if (currentTickets.some(ticket => ticket.id === newRecord.id)) {
                return currentTickets
              }
              const newTickets = [newRecord, ...currentTickets]
              console.log('Tickets after INSERT:', newTickets)
              return newTickets
            }
            
            case 'UPDATE': {
              if (!newRecord) return currentTickets
              const newTickets = currentTickets.map(ticket => 
                ticket.id === newRecord.id ? newRecord : ticket
              )
              console.log('Tickets after UPDATE:', newTickets)
              return newTickets
            }
            
            case 'DELETE': {
              if (!oldRecord) return currentTickets
              const newTickets = currentTickets.filter(ticket => 
                ticket.id !== oldRecord.id
              )
              console.log('Tickets after DELETE:', newTickets)
              return newTickets
            }
            
            default:
              return currentTickets
          }
        } catch (error) {
          console.error('Error processing ticket update:', error)
          return currentTickets
        }
      })
    })

    // Cleanup subscription
    return () => {
      console.log('Cleaning up subscription')
      mounted = false
      subscription.unsubscribe()
    }
  }, [ticketService])

  const validateForm = () => {
    const newErrors: FormErrors = {}
    if (!formData.customer_name) {
      newErrors.customer_name = 'Customer name is required'
    }
    if (!formData.customer_email) {
      newErrors.customer_email = 'Customer email is required'
    }
    if (!formData.coating_color) {
      newErrors.coating_color = 'Coating color is required'
    }
    setErrors(Object.values(newErrors))
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    
    if (!validateForm()) return

    try {
      const result = await ticketService.createTicket(formData)
      
      if ('errors' in result) {
        setErrors(result.errors ?? ['Unknown error occurred'])
        return
      }
      
      // Reset form on successful creation
      // The new ticket will be added via the subscription
      setFormData({
        customer_name: '',
        customer_email: '',
        coating_color: '',
        coating_finish: 'recommended_gloss'
      })
      setShowForm(false)
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to create ticket'])
    }
  }

  async function handleDelete(id: string) {
    try {
      await ticketService.deleteTicket(id)
      // The delete will be handled by the realtime subscription
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to delete ticket'])
    }
  }

  return (
    <div className="tickets-view">
      <div className="tickets-header">
        <h1>Tickets</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Ticket'}
        </button>
      </div>

      {errors.length > 0 && (
        <div role="alert" aria-label="validation error">
          {errors.map((error, index) => (
            <div key={index} className="error">{error}</div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="ticket-form">
          <div>
            <label htmlFor="customer_name">Customer Name</label>
            <input
              id="customer_name"
              value={formData.customer_name}
              onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
              aria-label="customer name"
            />
          </div>

          <div>
            <label htmlFor="customer_email">Customer Email</label>
            <input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={e => setFormData({ ...formData, customer_email: e.target.value })}
              aria-label="customer email"
            />
          </div>

          <div>
            <label htmlFor="coating_color">Coating Color</label>
            <input
              id="coating_color"
              value={formData.coating_color}
              onChange={e => setFormData({ ...formData, coating_color: e.target.value })}
              aria-label="coating color"
            />
          </div>

          <div>
            <label htmlFor="coating_finish">Coating Finish</label>
            <select
              id="coating_finish"
              value={formData.coating_finish}
              onChange={e => setFormData({ ...formData, coating_finish: e.target.value as CoatingFinish })}
              aria-label="coating finish"
            >
              <option value="recommended_gloss">Recommended Gloss</option>
              <option value="higher_gloss">Higher Gloss</option>
              <option value="lower_gloss">Lower Gloss</option>
            </select>
          </div>

          <button type="submit">Create Ticket</button>
        </form>
      )}

      <KanbanBoard tickets={tickets} ticketService={ticketService} />
    </div>
  )
} 