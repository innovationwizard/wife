"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"

interface AccountabilityItem {
  id: string
  title: string
  status: string
  createdAt: string
  statusChangedAt: string
}

export function AccountabilityView() {
  const [items, setItems] = useState<AccountabilityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const response = await fetch("/api/items?capturedBy=me")
      if (!response.ok) throw new Error("Failed to load items")
      const data: AccountabilityItem[] = await response.json()
      setItems(data)
    } catch (error) {
      console.error("Failed to fetch items", error)
    } finally {
      setLoading(false)
    }
  }

  function getDaysSince(date: string) {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  function getDaysSinceStatusChange(date: string) {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "DONE":
        return "text-emerald-600"
      case "CREATE":
        return "text-blue-600"
      case "TODO":
        return "text-slate-600"
      case "INBOX":
        return "text-amber-600"
      case "ON_HOLD":
        return "text-yellow-600"
      default:
        return "text-slate-500"
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading your items...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">No items captured yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Your Submissions</h2>
      <div className="space-y-2">
        {items.map((item) => {
          const daysSinceCreation = getDaysSince(item.createdAt)
          const daysSinceStatusChange = getDaysSinceStatusChange(item.statusChangedAt)
          const isStale = daysSinceStatusChange > 7

          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-slate-900 truncate">
                    {item.title}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {daysSinceCreation}d since creation
                      </span>
                      <span className={`flex items-center gap-1 ${isStale ? "text-amber-600" : ""}`}>
                        {isStale && <AlertTriangle className="h-3 w-3" />}
                        {daysSinceStatusChange}d since status change
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

