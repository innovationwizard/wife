"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { CaptureComposer } from "@/components/capture-composer"
import { AccountabilityView } from "@/components/accountability-view"

export function PWACaptureContent() {
  const [showAccountability, setShowAccountability] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header with navigation and logout button */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
        <h1 className="text-lg font-semibold text-slate-900">
          {showAccountability ? "My Submissions" : "Capture"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAccountability(!showAccountability)}
            className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            {showAccountability ? "Capture" : "My Submissions"}
          </button>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </form>
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

