"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function PWALayout({
  children,
}: {
  children: ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect Husband users away from PWA routes
  useEffect(() => {
    if (!isLoading && user?.role === 'HUSBAND') {
      router.replace('/')
    }
  }, [user, isLoading, router])

  // Don't render anything for Husband users - they should be redirected
  if (!isLoading && user?.role === 'HUSBAND') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  return <>{children}</>
}

