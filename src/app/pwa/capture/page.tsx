import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PWACaptureContent } from "@/components/pwa-capture-content"

export default async function PWACapturePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return <PWACaptureContent />
}

