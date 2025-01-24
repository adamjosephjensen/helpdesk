export type CoatingFinish = 'higher_gloss' | 'recommended_gloss' | 'lower_gloss'
export type TicketStatus = 'Order Received' | 'In Progress' | 'Ready for Pickup' | 'Completed'

export interface TicketData {
  customer_name: string
  customer_email: string
  coating_color: string
  coating_finish?: CoatingFinish
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

const VALID_COATING_FINISHES: CoatingFinish[] = ['higher_gloss', 'recommended_gloss', 'lower_gloss']

export function validateTicketCreation(data: Partial<TicketData>): ValidationResult {
  const errors: string[] = []

  if (!data.customer_name?.trim()) {
    errors.push('Customer name is required')
  }
  if (!data.customer_email?.trim()) {
    errors.push('Customer email is required')
  }
  if (!isValidEmail(data.customer_email)) {
    errors.push('Valid email is required')
  }
  if (!data.coating_color?.trim()) {
    errors.push('Coating color is required')
  }
  if (data.coating_finish && !VALID_COATING_FINISHES.includes(data.coating_finish)) {
    errors.push('Invalid coating finish specified')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function isValidEmail(email?: string): boolean {
  if (!email) return false
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
} 