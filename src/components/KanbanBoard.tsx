import React from 'react'
import { Ticket, TicketStatus } from '../types/ticket'
import { TicketService } from '../services/ticketService'
import './KanbanBoard.css'

const STATUS_ORDER: TicketStatus[] = [
  'Order Received',
  'In Progress',
  'Final Inspection',
  'Completed'
]

interface KanbanBoardProps {
  tickets: Ticket[]
  ticketService: TicketService
}

export function KanbanBoard({ tickets, ticketService }: KanbanBoardProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [loadingTickets, setLoadingTickets] = React.useState<Set<string>>(new Set())

  // Group tickets by status
  const ticketsByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = tickets.filter(ticket => ticket.status === status)
    return acc
  }, {} as Record<TicketStatus, Ticket[]>)

  const handleMoveToNextStatus = async (ticketId: string) => {
    try {
      setError(null)
      setLoadingTickets(prev => new Set(prev).add(ticketId))
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket) throw new Error('Ticket not found')
      
      const currentIndex = STATUS_ORDER.indexOf(ticket.status)
      if (currentIndex === STATUS_ORDER.length - 1) {
        throw new Error('Ticket is already in final status')
      }
      
      const nextStatus = STATUS_ORDER[currentIndex + 1]
      await ticketService.update(ticketId, { status: nextStatus })
    } catch (err) {
      console.error('Failed to move ticket:', err)
      setError(err instanceof Error ? err.message : 'Failed to move ticket')
    } finally {
      setLoadingTickets(prev => {
        const next = new Set(prev)
        next.delete(ticketId)
        return next
      })
    }
  }

  const handleMoveToStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      setError(null)
      setLoadingTickets(prev => new Set(prev).add(ticketId))
      await ticketService.update(ticketId, { status })
    } catch (err) {
      console.error('Failed to move ticket:', err)
      setError(err instanceof Error ? err.message : 'Failed to move ticket')
    } finally {
      setLoadingTickets(prev => {
        const next = new Set(prev)
        next.delete(ticketId)
        return next
      })
    }
  }

  return (
    <div className="kanban-board">
      {error && <div className="error-message">{error}</div>}
      <div className="kanban-columns">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="kanban-column">
            <h3 className="column-header">{status}</h3>
            <div className="ticket-list">
              {ticketsByStatus[status].map((ticket) => (
                <div
                  key={ticket.id}
                  className={`ticket-card ${loadingTickets.has(ticket.id) ? 'loading' : ''}`}
                >
                  <div className="ticket-header">
                    <span className="order-number">{ticket.order_number}</span>
                  </div>
                  <div className="ticket-body">
                    <div>{ticket.customer_name}</div>
                    <div>{ticket.coating_color}</div>
                    <div>{ticket.coating_finish}</div>
                  </div>
                  <div className="ticket-actions">
                    {status !== 'Completed' && (
                      <button 
                        onClick={() => handleMoveToNextStatus(ticket.id)}
                        className="next-stage-btn"
                        disabled={loadingTickets.has(ticket.id)}
                      >
                        {loadingTickets.has(ticket.id) ? 'Moving...' : 'Move to Next Stage'}
                      </button>
                    )}
                    <select
                      value={ticket.status}
                      onChange={(e) => handleMoveToStatus(ticket.id, e.target.value as TicketStatus)}
                      className="stage-select"
                      disabled={loadingTickets.has(ticket.id)}
                    >
                      {STATUS_ORDER.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 