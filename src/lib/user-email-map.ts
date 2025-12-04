/**
 * Maps user names to their email addresses
 * Used for Supabase Auth login
 */
export const USER_EMAIL_MAP: Record<string, string> = {
  'condor': 'jorgeluiscontrerasherrera@gmail.com',
  'estefani': 'stefani121@gmail.com',
}

/**
 * Get email address for a user name
 */
export function getEmailForUser(name: string): string | null {
  return USER_EMAIL_MAP[name.toLowerCase()] || null
}

/**
 * Get user name from email address
 */
export function getNameFromEmail(email: string): string | null {
  const entry = Object.entries(USER_EMAIL_MAP).find(([_, emailValue]) => 
    emailValue.toLowerCase() === email.toLowerCase()
  )
  return entry ? entry[0] : null
}

