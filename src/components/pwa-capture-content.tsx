"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { CaptureComposer } from "@/components/capture-composer"
import { AccountabilityView } from "@/components/accountability-view"

export function PWACaptureContent() {
  const [showAccountability, setShowAccountability] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  function handleSignOut() {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header with navigation and logout button */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-6">
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

      {/* Main content */}
      <main className="flex flex-1 justify-center overflow-y-auto px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-4">
          {!showAccountability ? (
            <CaptureComposer variant="pwa" />
          ) : (
            <AccountabilityView />
          )}
        </div>
      </main>
    </div>
  )
}

