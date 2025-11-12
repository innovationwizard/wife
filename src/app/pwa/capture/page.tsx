import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CaptureComposer } from "@/components/capture-composer"

export default async function PWACapturePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen justify-center bg-white px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <CaptureComposer variant="pwa" />
      </div>
    </div>
  )
}

