'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getEmailForUser } from '@/lib/user-email-map'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface User {
  id: string
  name: string
  role: 'HUSBAND' | 'WIFE'
}

interface AuthContextType {
  user: User | null
  login: (name: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session and fetch user role on mount
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserRole(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchUserRole(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch user role from User table based on Supabase auth user
  const fetchUserRole = async (userId: string) => {
    try {
      // First, try to get user metadata from Supabase Auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser?.user_metadata?.role) {
        // Role stored in user metadata
        console.log('[AuthContext] Using role from auth metadata:', authUser.user_metadata.role)
        setUser({
          id: authUser.id,
          name: authUser.user_metadata.name || authUser.email?.split('@')[0] || 'User',
          role: authUser.user_metadata.role
        })
        setIsLoading(false)
        return
      }

      // Fallback: Query User table by id (this is the source of truth)
      const { data: userData, error } = await supabase
        .from('User')
        .select('id, name, role')
        .eq('id', userId)
        .single()

      if (userData && !error) {
        // User table is the source of truth for role
        console.log('[AuthContext] Fetched user from User table:', userData.name, 'Role:', userData.role)
        setUser({
          id: userData.id,
          name: userData.name,
          role: userData.role
        })
        setIsLoading(false)
        return
      }

      // If user not found in User table, use auth metadata
      if (authUser) {
        const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
        // Check auth metadata role, but prefer User table (already checked above)
        const role = (authUser.user_metadata?.role || 'HUSBAND') as 'HUSBAND' | 'WIFE'
        setUser({
          id: authUser.id,
          name,
          role
        })
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      // Get email address for the user name
      const email = getEmailForUser(name)
      
      if (!email) {
        console.error('No email found for user:', name)
        return false
      }

      // Sign in with Supabase Auth using real email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase auth error:', error)
        return false
      }

      if (data.user && data.session) {
        // Fetch user role
        await fetchUserRole(data.user.id)
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
