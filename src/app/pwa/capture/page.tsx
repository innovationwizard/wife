"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { PWACaptureContent } from "@/components/pwa-capture-content"

export default function PWACapturePage() {
  return (
    <AuthGuard>
      <PWACaptureContent />
    </AuthGuard>
  )
}

