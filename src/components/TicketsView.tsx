import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { TicketService } from '../services/ticketService'
import { TicketData, CoatingFinish } from '../domain/ticket'
import { Ticket } from '../repositories/ticketRepository'

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

  useEffect(() => {
    // Initial load
    loadTickets()

    // Set up subscription
    const subscription = ticketService.subscribeToTickets((payload) => {
      console.log('Received ticket update:', payload)
      setTickets(currentTickets => {
        switch (payload.eventType) {
          case 'INSERT': {
            const newTicket = payload.new
            if (!newTicket) return currentTickets
            // Check if we already have this ticket
            if (currentTickets.some(ticket => ticket.id === newTicket.id)) {
              return currentTickets
            }
            return [newTicket, ...currentTickets]
          }
          
          case 'UPDATE': {
            const updatedTicket = payload.new
            if (!updatedTicket) return currentTickets
            return currentTickets.map(ticket => 
              ticket.id === updatedTicket.id ? updatedTicket : ticket
            )
          }
          
          case 'DELETE': {
            const deletedTicket = payload.old
            if (!deletedTicket) return currentTickets
            return currentTickets.filter(ticket => 
              ticket.id !== deletedTicket.id
            )
          }
          
          default:
            return currentTickets
        }
      })
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [ticketService])

  async function loadTickets() {
    try {
      const tickets = await ticketService.getAllTickets()
      setTickets(tickets)
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to load tickets'])
    }
  }

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
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to create ticket'])
    }
  }

  async function handleDelete(id: string) {
    try {
      await ticketService.deleteTicket(id)
      await loadTickets()
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to delete ticket'])
    }
  }

  return (
    <div>
      {errors.length > 0 && (
        <div role="alert" aria-label="validation error">
          {errors.map((error, index) => (
            <div key={index} className="error">{error}</div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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

      <ul>
        {tickets.map(ticket => (
          <li key={ticket.id} data-testid="ticket">
            <span data-testid="order-number">{ticket.order_number}</span>
            <span data-testid="customer-name">{ticket.customer_name}</span>
            <span data-testid="coating-color">{ticket.coating_color}</span>
            <span data-testid="coating-finish">{ticket.coating_finish}</span>
            <button onClick={() => handleDelete(ticket.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
} 