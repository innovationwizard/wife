"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { CaptureComposer } from "@/components/capture-composer"
import { AccountabilityView } from "@/components/accountability-view"

export function PWACaptureContent() {
  const [showAccountability, setShowAccountability] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  const { logout, user } = useAuth()

  // Debug: Check localStorage and window.__authDebug
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateDebug = () => {
        const stored = localStorage.getItem('wife_app_user')
        const debug = (window as any).__authDebug
        setDebugInfo({
          localStorage: stored ? JSON.parse(stored) : null,
          debug: debug,
          user: user,
          timestamp: new Date().toISOString()
        })
      }
      updateDebug()
      const interval = setInterval(updateDebug, 1000)
      return () => clearInterval(interval)
    }
  }, [user])

  function handleSignOut() {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header with navigation and logout button */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-6 safe-area-top" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <h1 className="min-w-0 text-base font-semibold text-slate-900 sm:text-lg">
          {showAccountability ? "Follow Up" : "Command Center"}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAccountability(!showAccountability)}
            className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 min-h-[48px] font-medium"
          >
            {showAccountability ? "Command Center" : "Follow Up"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 min-h-[48px] font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebug && debugInfo && (
        <div className="border-t border-red-300 bg-red-50 p-4 text-xs font-mono">
          <div className="mb-2 font-bold text-red-900">DEBUG INFO:</div>
          <div className="space-y-1 text-red-800">
            <div><strong>User from AuthContext:</strong> {user ? JSON.stringify(user) : 'null'}</div>
            <div><strong>localStorage:</strong> {debugInfo.localStorage ? JSON.stringify(debugInfo.localStorage) : 'null'}</div>
            <div><strong>window.__authDebug:</strong> {debugInfo.debug ? JSON.stringify(debugInfo.debug, null, 2) : 'null'}</div>
            <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex flex-1 justify-center overflow-y-auto px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-4">
          {!showAccountability ? (
            <CaptureComposer variant="pwa" />
          ) : (
            <AccountabilityView />
          )}
          {/* Debug Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="fixed bottom-4 right-4 rounded-full bg-red-500 px-3 py-2 text-xs font-bold text-white shadow-lg"
          >
            {showDebug ? 'HIDE DEBUG' : 'SHOW DEBUG'}
          </button>
        </div>
      </main>
    </div>
  )
}

