"use client"

import { Inbox, CheckCircle2, PlayCircle, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useItems } from "@/hooks/useItems"

interface Stats {
  inbox: number
  inProgress: number
  completed: number
  total: number
}

export default function HomePage() {
  const { items, loading } = useItems()
  
  const stats: Stats = {
    inbox: items.filter(item => item.status === "INBOX").length,
    inProgress: items.filter(item => 
      item.status === "DOING" || item.status === "IN_REVIEW"
    ).length,
    completed: items.filter(item => item.status === "DONE").length,
    total: items.length
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">
            Welcome to Wife App
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Simple task management for you and your family.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/inbox"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer active:bg-slate-100 md:p-5 min-h-[80px] flex flex-col justify-between"
            prefetch={true}
            onClick={(e) => {
              console.log("Inbox clicked, navigating...")
            }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-100 p-2">
                <Inbox className="h-5 w-5 text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-slate-500">Inbox</h2>
                <p className="mt-1 text-2xl font-semibold text-rose-600">
                  {loading ? "…" : stats?.inbox ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Items waiting for triage
            </p>
          </Link>

          <Link
            href="/workflow"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 md:p-5 min-h-[80px] flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 shrink-0">
                <PlayCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-medium text-slate-500 md:text-sm">In Progress</h2>
                <p className="mt-1 text-xl font-semibold text-amber-600 md:text-2xl">
                  {loading ? "…" : stats?.inProgress ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Active work items
            </p>
          </Link>

          <Link
            href="/workflow"
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 md:p-5 min-h-[80px] flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-medium text-slate-500 md:text-sm">Completed</h2>
                <p className="mt-1 text-xl font-semibold text-emerald-600 md:text-2xl">
                  {loading ? "…" : stats?.completed ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Finished items
            </p>
          </Link>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 shrink-0">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-medium text-slate-500 md:text-sm">Total Items</h2>
                <p className="mt-1 text-xl font-semibold text-slate-900 md:text-2xl">
                  {loading ? "…" : stats?.total ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              All items in system
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/capture"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 min-h-[120px] flex flex-col justify-between md:p-6"
          >
            <h3 className="text-base font-semibold text-slate-900 md:text-lg">Capture</h3>
            <p className="mt-2 text-sm text-slate-600">
              Capture new ideas, tasks, or information quickly.
            </p>
          </Link>

          <Link
            href="/workflow"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 min-h-[120px] flex flex-col justify-between md:p-6"
          >
            <h3 className="text-base font-semibold text-slate-900 md:text-lg">Workflow</h3>
            <p className="mt-2 text-sm text-slate-600">
              Manage your active tasks and projects.
            </p>
          </Link>

        </section>
    </div>
  )
}
