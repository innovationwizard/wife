"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

interface InboxItem {
  id: string
  title: string
  rawInstructions: string
  createdAt: string
  capturedBy?: {
    email: string | null
  } | null
}

export default function InboxPage() {
  const router = useRouter()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const response = await fetch("/api/items?status=INBOX", {
        cache: "no-store"
      })
      if (!response.ok) {
        throw new Error("Failed to load inbox")
      }
      const data: InboxItem[] = await response.json()
      setItems(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const currentItem = useMemo(() => items[0] ?? null, [items])

  async function handleNotActionable() {
    if (!currentItem || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/items/${currentItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "LIBRARY",
          type: "INFO"
        })
      })

      if (!response.ok) {
        throw new Error("Failed to archive item")
      }

      setItems((prev) => prev.slice(1))
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  function handleActionable() {
    if (!currentItem || submitting) return
    router.push(`/clean?item=${currentItem.id}`)
  }

  if (loading) {
    return (
      <div className="px-6 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading inbox…
        </div>
      </div>
    )
  }

  if (!currentItem) {
    return (
      <div className="px-6 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Inbox clear</h2>
          <p className="mt-2 text-sm text-slate-500">
            Everything captured has been clarified. Great job.
          </p>
        </div>
      </div>
    )
  }

  const capturedByLabel = currentItem.capturedBy?.email ?? "Creator"
  const createdAt = new Date(currentItem.createdAt).toLocaleString()

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Step 2 · Clarify Inbox
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Determine whether it needs action
          </h1>
          <p className="text-sm text-slate-500">
            Items captured land here first. Decide whether they should move into
            workflow or be stored as information.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Captured by {capturedByLabel}
            </span>
            <span>{createdAt}</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {currentItem.title}
            </h2>
            <p className="min-h-[120px] whitespace-pre-wrap text-sm text-slate-700">
              {currentItem.rawInstructions}
            </p>
          </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Clarify: Is this actionable?
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleNotActionable}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-60"
                >
                  No – store as reference
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Send to Library as information
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleActionable}
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                >
                  Yes – continue to workflow
                  <span className="mt-1 block text-xs font-normal text-slate-200">
                    Move forward to routing
                  </span>
                </button>
              </div>
            </div>
        </section>

        {items.length > 1 && (
          <p className="text-xs text-slate-400">
            {items.length - 1} additional item
            {items.length - 1 === 1 ? "" : "s"} waiting in inbox.
          </p>
        )}
      </div>
    </div>
  )
}

