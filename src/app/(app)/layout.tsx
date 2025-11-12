import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"

export default async function AppLayout({
  children
}: {
  children: ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

