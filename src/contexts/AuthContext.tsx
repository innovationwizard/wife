'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getEmailForUser, getNameFromEmail, USER_EMAIL_MAP } from '@/lib/user-email-map'
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

  // Helper to set user and persist to localStorage
  const setUserAndPersist = useCallback((userObj: User | null) => {
    // Use multiple logging methods for Safari simulator debugging
    const logMsg = `[AuthContext] setUserAndPersist called with: ${JSON.stringify(userObj)}`
    console.log(logMsg)
    console.warn(logMsg) // Also log as warning for visibility
    if (typeof window !== 'undefined') {
      // Store debug info in window for inspection
      ;(window as any).__authDebug = { ...((window as any).__authDebug || {}), setUserAndPersist: { userObj, timestamp: new Date().toISOString() } }
    }
    
    if (!userObj) {
      const clearMsg = '[AuthContext] setUserAndPersist - userObj is null, clearing'
      console.log(clearMsg)
      console.warn(clearMsg)
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wife_app_user')
        const clearedMsg = '[AuthContext] setUserAndPersist - cleared localStorage'
        console.log(clearedMsg)
        console.warn(clearedMsg)
      }
      return
    }

    // Validate userObj structure
    if (!userObj.id || !userObj.name || !userObj.role) {
      const errorMsg = `[AuthContext] setUserAndPersist - Invalid userObj structure: ${JSON.stringify(userObj)}`
      console.error(errorMsg)
      console.warn(errorMsg)
      return
    }

    const validMsg = '[AuthContext] setUserAndPersist - Valid userObj, setting state and localStorage'
    console.log(validMsg)
    console.warn(validMsg)
    setUser(userObj)
    
    if (typeof window !== 'undefined') {
      try {
        const jsonStr = JSON.stringify(userObj)
        const jsonMsg = `[AuthContext] setUserAndPersist - JSON string: ${jsonStr}`
        console.log(jsonMsg)
        console.warn(jsonMsg)
        
        localStorage.setItem('wife_app_user', jsonStr)
        const setItemMsg = '[AuthContext] setUserAndPersist - ✅ Called localStorage.setItem'
        console.log(setItemMsg)
        console.warn(setItemMsg)
        
        // Verify it was saved immediately
        const verify = localStorage.getItem('wife_app_user')
        const verifyMsg = `[AuthContext] setUserAndPersist - Verification read: ${verify}`
        console.log(verifyMsg)
        console.warn(verifyMsg)
        
        if (verify === jsonStr) {
          const successMsg = '[AuthContext] setUserAndPersist - ✅ Verification successful!'
          console.log(successMsg)
          console.warn(successMsg)
          // Also store in window for easy inspection
          ;(window as any).__authDebug = { ...((window as any).__authDebug || {}), localStorage: { saved: true, data: JSON.parse(verify || 'null'), timestamp: new Date().toISOString() } }
        } else {
          const failMsg = `[AuthContext] setUserAndPersist - ❌ Verification failed! Expected: ${jsonStr} Got: ${verify}`
          console.error(failMsg)
          console.warn(failMsg)
          ;(window as any).__authDebug = { ...((window as any).__authDebug || {}), localStorage: { saved: false, expected: jsonStr, got: verify, timestamp: new Date().toISOString() } }
        }
        
        // Try parsing to make sure it's valid JSON
        try {
          const parsed = JSON.parse(verify || 'null')
          const parsedMsg = `[AuthContext] setUserAndPersist - Parsed verification: ${JSON.stringify(parsed)}`
          console.log(parsedMsg)
          console.warn(parsedMsg)
        } catch (parseError) {
          const parseErrorMsg = `[AuthContext] setUserAndPersist - Error parsing verification: ${parseError}`
          console.error(parseErrorMsg)
          console.warn(parseErrorMsg)
        }
      } catch (error) {
        const errorMsg = `[AuthContext] setUserAndPersist - ❌ Error saving to localStorage: ${error}`
        console.error(errorMsg)
        console.warn(errorMsg)
        ;(window as any).__authDebug = { ...((window as any).__authDebug || {}), localStorage: { error: String(error), timestamp: new Date().toISOString() } }
      }
    } else {
      const ssrMsg = '[AuthContext] setUserAndPersist - window is undefined (SSR)'
      console.log(ssrMsg)
      console.warn(ssrMsg)
    }
  }, [])

  // Fetch user role from User table based on Supabase auth user
  const fetchUserRole = useCallback(async (userId: string) => {
    const startMsg = `[AuthContext] fetchUserRole called with userId: ${userId}`
    console.log(startMsg)
    console.warn(startMsg)
    if (typeof window !== 'undefined') {
      ;(window as any).__authDebug = { ...((window as any).__authDebug || {}), fetchUserRole: { userId, timestamp: new Date().toISOString() } }
    }
    
    try {
      // First, get the auth user to get their email
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        const errorMsg = `[AuthContext] Error getting auth user: ${JSON.stringify(authError)}`
        console.error(errorMsg)
        console.warn(errorMsg)
        setIsLoading(false)
        return
      }
      
      if (!authUser) {
        const noUserMsg = '[AuthContext] No auth user found'
        console.error(noUserMsg)
        console.warn(noUserMsg)
        setIsLoading(false)
        return
      }

      const authUserMsg = `[AuthContext] Auth user: ${JSON.stringify({ id: authUser.id, email: authUser.email, metadata: authUser.user_metadata })}`
      console.log(authUserMsg)
      console.warn(authUserMsg)
      if (typeof window !== 'undefined') {
        ;(window as any).__authDebug = { ...((window as any).__authDebug || {}), authUser: { id: authUser.id, email: authUser.email, metadata: authUser.user_metadata, timestamp: new Date().toISOString() } }
      }

      // PRIORITY 1: Look up User table by name (using email-to-name mapping)
      // User table is the source of truth for role - prioritize this over metadata
      if (authUser.email) {
        const userName = getNameFromEmail(authUser.email)
        const mappingMsg = `[AuthContext] Email to name mapping: ${authUser.email} → ${userName}`
        console.log(mappingMsg)
        console.warn(mappingMsg)
        
        if (userName) {
          const lookupMsg = `[AuthContext] Looking up User table by name: ${userName}`
          console.log(lookupMsg)
          console.warn(lookupMsg)
          const { data: userData, error } = await supabase
            .from('User')
            .select('id, name, role')
            .eq('name', userName)
            .single()

          const queryMsg = `[AuthContext] User table query result: ${JSON.stringify({ userData, error })}`
          console.log(queryMsg)
          console.warn(queryMsg)

          if (userData && !error) {
            // User table is the source of truth for role
            const successMsg = `[AuthContext] ✅ Fetched user from User table by name: ${userData.name} Role: ${userData.role}`
            console.log(successMsg)
            console.warn(successMsg)
            const userObj = {
              id: userData.id,
              name: userData.name,
              role: userData.role
            }
            const settingUserMsg = `[AuthContext] Setting user from User table: ${JSON.stringify(userObj)}`
            console.log(settingUserMsg)
            console.warn(settingUserMsg)
            setUserAndPersist(userObj)
            setIsLoading(false)
            return
          } else {
            const notFoundMsg = `[AuthContext] ❌ User not found in User table by name: ${userName} Error: ${JSON.stringify(error)}`
            console.error(notFoundMsg)
            console.warn(notFoundMsg)
            // List all users for debugging
            const { data: allUsers } = await supabase.from('User').select('id, name, role').limit(10)
            const allUsersMsg = `[AuthContext] All users in User table: ${JSON.stringify(allUsers)}`
            console.log(allUsersMsg)
            console.warn(allUsersMsg)
          }
        } else {
          const noMappingMsg = `[AuthContext] ❌ Could not map email to name: ${authUser.email}`
          console.error(noMappingMsg)
          console.warn(noMappingMsg)
          const mappingsMsg = `[AuthContext] Available email mappings: ${JSON.stringify(Object.entries(USER_EMAIL_MAP))}`
          console.log(mappingsMsg)
          console.warn(mappingsMsg)
        }
      }

      // PRIORITY 2: Fallback to user metadata (only if User table lookup failed)
      if (authUser.user_metadata?.role) {
        const metadataMsg = `[AuthContext] ⚠️ Using role from auth metadata (fallback): ${authUser.user_metadata.role}`
        console.log(metadataMsg)
        console.warn(metadataMsg)
        const userObj = {
          id: authUser.id,
          name: authUser.user_metadata.name || authUser.email?.split('@')[0] || 'User',
          role: authUser.user_metadata.role === 'CREATOR' ? 'HUSBAND' : authUser.user_metadata.role // Transform CREATOR to HUSBAND
        }
        const settingMsg = `[AuthContext] Setting user from metadata (fallback): ${JSON.stringify(userObj)}`
        console.log(settingMsg)
        console.warn(settingMsg)
        setUserAndPersist(userObj)
        setIsLoading(false)
        return
      }

      // Fallback: Try by ID (in case name lookup fails)
      const idLookupMsg = `[AuthContext] Trying User table lookup by ID: ${userId}`
      console.log(idLookupMsg)
      console.warn(idLookupMsg)
      const { data: userDataById, error: errorById } = await supabase
        .from('User')
        .select('id, name, role')
        .eq('id', userId)
        .single()

      if (userDataById && !errorById) {
        const idSuccessMsg = `[AuthContext] ✅ Fetched user from User table by ID: ${userDataById.name} Role: ${userDataById.role}`
        console.log(idSuccessMsg)
        console.warn(idSuccessMsg)
        const userObj = {
          id: userDataById.id,
          name: userDataById.name,
          role: userDataById.role
        }
        const settingIdMsg = `[AuthContext] Setting user from User table (ID lookup): ${JSON.stringify(userObj)}`
        console.log(settingIdMsg)
        console.warn(settingIdMsg)
        setUserAndPersist(userObj)
        setIsLoading(false)
        return
      } else {
        const idErrorMsg = `[AuthContext] ❌ User not found in User table by ID: ${userId} Error: ${JSON.stringify(errorById)}`
        console.error(idErrorMsg)
        console.warn(idErrorMsg)
      }

      // Final fallback: Use auth metadata
      if (authUser) {
        const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
        const role = (authUser.user_metadata?.role || 'HUSBAND') as 'HUSBAND' | 'WIFE'
        const userObj = {
          id: authUser.id,
          name,
          role
        }
        const fallbackMsg = `[AuthContext] ⚠️ Using fallback auth metadata, userObj: ${JSON.stringify(userObj)}`
        console.log(fallbackMsg)
        console.warn(fallbackMsg)
        const settingFallbackMsg = '[AuthContext] Setting user from fallback metadata'
        console.log(settingFallbackMsg)
        console.warn(settingFallbackMsg)
        setUserAndPersist(userObj)
      } else {
        const noAuthMsg = '[AuthContext] ❌ No authUser available for fallback'
        console.error(noAuthMsg)
        console.warn(noAuthMsg)
      }
    } catch (error) {
      const exceptionMsg = `[AuthContext] ❌ Exception in fetchUserRole: ${error}`
      console.error(exceptionMsg)
      console.warn(exceptionMsg)
      if (typeof window !== 'undefined') {
        ;(window as any).__authDebug = { ...((window as any).__authDebug || {}), error: { message: String(error), timestamp: new Date().toISOString() } }
      }
    } finally {
      setIsLoading(false)
    }
  }, [setUserAndPersist])

  // Load session and fetch user role on mount
  useEffect(() => {
    // Clear any stale localStorage data first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wife_app_user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // If role is CREATOR, clear it and force fresh fetch
          if (parsed.role === 'CREATOR') {
            console.log('[AuthContext] Found CREATOR in localStorage, clearing and fetching fresh')
            localStorage.removeItem('wife_app_user')
          }
        } catch (e) {
          // Invalid data, clear it
          localStorage.removeItem('wife_app_user')
        }
      }
    }

    // Check for existing session FIRST, then fetch fresh data
    // Don't load from localStorage - always fetch fresh from DB
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Always fetch fresh from database, ignore localStorage
        console.log('[AuthContext] Session found, fetching fresh user role from DB')
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
        setUserAndPersist(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserRole])

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      // Get email address for the user name
      const email = getEmailForUser(name)
      
      if (!email) {
        console.error('[AuthContext] No email found for user:', name)
        return false
      }

      console.log('[AuthContext] Attempting login for:', name, 'email:', email)

      // Sign in with Supabase Auth using real email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[AuthContext] Supabase auth error:', error)
        return false
      }

      if (data.user && data.session) {
        console.log('[AuthContext] Login successful, fetching user role for:', data.user.id)
        // Fetch user role - this will set user and save to localStorage
        await fetchUserRole(data.user.id)
        
        // Verify localStorage was set (state might not be updated yet)
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('wife_app_user')
          console.log('[AuthContext] localStorage after fetchUserRole:', stored)
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              console.log('[AuthContext] Parsed localStorage user:', parsed)
            } catch (e) {
              console.error('[AuthContext] Error parsing localStorage:', e)
            }
          } else {
            console.error('[AuthContext] WARNING: localStorage is still null after fetchUserRole!')
          }
        }
        
        return true
      }

      console.error('[AuthContext] Login failed: no user or session')
      return false
    } catch (error) {
      console.error('[AuthContext] Login error:', error)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUserAndPersist(null)
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
