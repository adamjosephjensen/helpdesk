export interface User {
  id: string
  email: string
}

export function signIn(email: string): Promise<void>
export function signOut(): Promise<void>
export function getCurrentUser(): Promise<User | null> 