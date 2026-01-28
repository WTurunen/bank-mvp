export type ValidationResult = {
  valid: boolean
  field: string
  message: string
}

export const CLIENT_VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'Client name is required',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
}

export type ClientFormData = {
  name: string
  email: string
  phone?: string
  address?: string
}

function validResult(field: string): ValidationResult {
  return { valid: true, field, message: '' }
}

function invalidResult(field: string, message: string): ValidationResult {
  return { valid: false, field, message }
}

export function validateClientName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return invalidResult('name', CLIENT_VALIDATION_MESSAGES.NAME_REQUIRED)
  }
  return validResult('name')
}

export function validateClientEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return invalidResult('email', CLIENT_VALIDATION_MESSAGES.EMAIL_REQUIRED)
  }

  // Simple email validation: must have @ with content before and after
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return invalidResult('email', CLIENT_VALIDATION_MESSAGES.EMAIL_INVALID)
  }

  return validResult('email')
}

export function validateClient(data: ClientFormData): ValidationResult[] {
  const errors: ValidationResult[] = []

  const nameResult = validateClientName(data.name)
  if (!nameResult.valid) {
    errors.push(nameResult)
  }

  const emailResult = validateClientEmail(data.email)
  if (!emailResult.valid) {
    errors.push(emailResult)
  }

  return errors
}
