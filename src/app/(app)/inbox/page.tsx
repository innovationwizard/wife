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
      console.log(`[Inbox] Fetched ${data.length} items from server`)
      console.log(`[Inbox] All items:`, data.map(item => ({
        id: item.id,
        title: item.title,
        capturedBy: item.capturedBy?.email,
        createdAt: item.createdAt,
        status: 'INBOX' // All items should be INBOX since we filter by status=INBOX
      })))
      
      if (data.length === 0) {
        console.warn(`[Inbox] No items found! This might indicate items were processed or there's a query issue.`)
      } else if (data.length === 1) {
        console.warn(`[Inbox] Only 1 item found. If more were captured, they may have been processed or there's a filtering issue.`)
      }
      
      setItems(data)
    } catch (error) {
      console.error("[Inbox] Error fetching items:", error)
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

      // Refetch items from server to get the latest state
      // This ensures we see all items, including any new ones added while processing
      await fetchItems()
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
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">
              {items.length - 1} additional item
              {items.length - 1 === 1 ? "" : "s"} waiting in inbox:
            </p>
            <ul className="space-y-1 text-xs text-slate-500">
              {items.slice(1, 6).map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span className="truncate">{item.title}</span>
                  <span className="ml-2 text-slate-400">
                    {item.capturedBy?.email ? `by ${item.capturedBy.email.split("@")[0]}` : "by Creator"}
                  </span>
                </li>
              ))}
              {items.length > 6 && (
                <li className="text-slate-400">
                  ...and {items.length - 6} more
                </li>
              )}
            </ul>
          </div>
        )}
        
        {/* Debug info - show in production to help diagnose missing items */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
          <summary className="cursor-pointer font-semibold text-slate-600">
            Debug: All INBOX items ({items.length})
          </summary>
          <div className="mt-2 space-y-2">
            <p className="text-xs text-slate-500">
              Showing items with status=INBOX. If you expected more items, they may have been processed.
            </p>
            {items.length === 0 && (
              <p className="text-xs text-amber-600 font-medium">
                ⚠️ No items in INBOX. Check Workflow page or Library to see where items went.
              </p>
            )}
            <pre className="overflow-auto text-xs text-slate-500 max-h-40">
              {JSON.stringify(items.map(item => ({
                id: item.id,
                title: item.title,
                capturedBy: item.capturedBy?.email,
                createdAt: item.createdAt
              })), null, 2)}
            </pre>
          </div>
        </details>
        
        {/* Check all items regardless of status */}
        <AllItemsDiagnostic />
      </div>
    </div>
  )
}

// Diagnostic component to check all items
function AllItemsDiagnostic() {
  const [allItems, setAllItems] = useState<Array<{ id: string; title: string; status: string; capturedBy?: { email: string | null } | null; createdAt: string }>>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (expanded && !loading && allItems.length === 0) {
      void fetchAllItems()
    }
  }, [expanded])

  async function fetchAllItems() {
    setLoading(true)
    try {
      const response = await fetch("/api/items", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      setAllItems(data)
    } catch (error) {
      console.error("Failed to fetch all items", error)
    } finally {
      setLoading(false)
    }
  }

  const itemsByStatus = allItems.reduce((acc, item) => {
    const status = item.status || "UNKNOWN"
    if (!acc[status]) acc[status] = []
    acc[status].push(item)
    return acc
  }, {} as Record<string, typeof allItems>)

  return (
    <details 
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs"
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer font-semibold text-amber-700">
        🔍 Diagnostic: Check ALL items (all statuses) - {loading ? "Loading..." : allItems.length > 0 ? `${allItems.length} total` : "Click to load"}
      </summary>
      <div className="mt-2 space-y-2">
        {loading ? (
          <p className="text-xs text-amber-600">Loading all items...</p>
        ) : allItems.length === 0 && expanded ? (
          <p className="text-xs text-amber-600">No items found. This might indicate a database issue.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(itemsByStatus).map(([status, statusItems]) => (
              <div key={status} className="rounded border border-amber-200 bg-white p-2">
                <p className="font-semibold text-amber-700">
                  {status}: {statusItems.length} item{statusItems.length !== 1 ? "s" : ""}
                </p>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {statusItems.slice(0, 5).map((item) => (
                    <li key={item.id} className="truncate">
                      • {item.title} {item.capturedBy?.email ? `(by ${item.capturedBy.email.split("@")[0]})` : ""} - {new Date(item.createdAt).toLocaleString()}
                    </li>
                  ))}
                  {statusItems.length > 5 && (
                    <li className="text-slate-400">...and {statusItems.length - 5} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  )
}

