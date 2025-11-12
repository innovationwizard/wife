"use client"

import { useState } from "react"
import { CaptureComposer } from "@/components/capture-composer"
import { AccountabilityView } from "@/components/accountability-view"

export function PWACaptureContent() {
  const [showAccountability, setShowAccountability] = useState(false)

  return (
    <div className="flex min-h-screen justify-center bg-white px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-4">
        {!showAccountability ? (
          <>
            <CaptureComposer variant="pwa" />
            <button
              type="button"
              onClick={() => setShowAccountability(true)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              View My Submissions
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-slate-900">My Submissions</h1>
              <button
                type="button"
                onClick={() => setShowAccountability(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                Back to Capture
              </button>
            </div>
            <AccountabilityView />
          </>
        )}
      </div>
    </div>
  )
}

