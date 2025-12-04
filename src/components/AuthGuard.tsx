'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    // If user is logged in, check role-based routing
    if (user && !isLoading) {
      // Wife should only access /pwa/* routes
      if (user.role === 'WIFE' && !pathname?.startsWith('/pwa')) {
        router.push('/pwa/capture')
        return
      }
      
      // Husband should not access /pwa/* routes (redirect to home)
      if (user.role === 'HUSBAND' && pathname?.startsWith('/pwa')) {
        router.push('/')
        return
      }
    }
  }, [user, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

