import { describe, it, expect } from 'vitest'
import { validateTicketCreation, TicketData, CoatingFinish } from '../ticket'

describe('Ticket Validation', () => {
  it('requires customer name', () => {
    const data: Partial<TicketData> = {
      customer_email: 'john@example.com',
      coating_color: 'black'
    }
    const result = validateTicketCreation(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Customer name is required')
  })

  it('requires customer email', () => {
    const data: Partial<TicketData> = {
      customer_name: 'John Doe',
      coating_color: 'black'
    }
    const result = validateTicketCreation(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Customer email is required')
  })

  it('requires valid email format', () => {
    const data: Partial<TicketData> = {
      customer_name: 'John Doe',
      customer_email: 'not-an-email',
      coating_color: 'black'
    }
    const result = validateTicketCreation(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Valid email is required')
  })

  it('requires coating color', () => {
    const data: Partial<TicketData> = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com'
    }
    const result = validateTicketCreation(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Coating color is required')
  })

  it('accepts valid ticket data', () => {
    const data: TicketData = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      coating_color: 'black'
    }
    const result = validateTicketCreation(data)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('trims whitespace when checking required fields', () => {
    const data: Partial<TicketData> = {
      customer_name: '   ',
      customer_email: 'john@example.com',
      coating_color: 'black'
    }
    const result = validateTicketCreation(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Customer name is required')
  })

  describe('coating_finish', () => {
    it('allows ticket creation without specifying coating_finish', () => {
      const data: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black'
        // coating_finish intentionally omitted
      }
      const result = validateTicketCreation(data)
      expect(result.isValid).toBe(true)
    })

    it('validates coating_finish value when provided', () => {
      const data: TicketData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        coating_color: 'black',
        coating_finish: 'invalid_finish' as CoatingFinish
      }
      const result = validateTicketCreation(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid coating finish specified')
    })

    it('accepts valid coating_finish values', () => {
      const validFinishes: CoatingFinish[] = ['higher_gloss', 'recommended_gloss', 'lower_gloss']
      
      validFinishes.forEach(finish => {
        const data: TicketData = {
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          coating_color: 'black',
          coating_finish: finish
        }
        const result = validateTicketCreation(data)
        expect(result.isValid).toBe(true)
      })
    })
  })
}) 