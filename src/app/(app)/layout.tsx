"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Menu } from "lucide-react"

export default function AppLayout({
  children
}: {
  children: ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect Wife users to PWA capture immediately
  useEffect(() => {
    if (!isLoading && user) {
      console.log('[AppLayout] User role:', user.role, 'User:', user.name)
      if (user.role === 'WIFE') {
        console.log('[AppLayout] Redirecting Wife user to /pwa/capture')
        router.replace('/pwa/capture')
      }
    }
  }, [user, isLoading, router])

  // Don't render anything for Wife users - they should be redirected
  if (!isLoading && user?.role === 'WIFE') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar 
          user={user ? { name: user.name, role: user.role } : undefined}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header with hamburger menu */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                <span className="text-rose-600 text-sm">❤️</span>
              </span>
              <span className="text-sm font-semibold text-slate-900">Wife App</span>
            </div>
          </div>
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
