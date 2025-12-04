"use client"

import { useState } from "react"
import { Clock, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useItems, deleteItem } from "@/hooks/useItems"
import { ItemStatus } from "@prisma/client"

interface AccountabilityItem {
  id: string
  title: string
  status: string
  createdAt: string
  statusChangedAt: string
}

export function AccountabilityView() {
  const { user } = useAuth()
  const { items, loading, error, refetch } = useItems({ capturedBy: 'me' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const accountabilityItems: AccountabilityItem[] = items.map(item => ({
    id: item.id,
    title: item.title,
    status: item.status,
    createdAt: item.createdAt,
    statusChangedAt: item.statusChangedAt || item.createdAt
  }))

  async function handleDelete(itemId: string) {
    if (!user) return
    
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return
    }

    setDeletingId(itemId)
    try {
      await deleteItem({
        id: itemId,
        userId: user.id,
        userRole: user.role
      })
      // Refetch items to update the list
      if (refetch) {
        refetch()
      } else {
        // If refetch not available, reload the page
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      alert('Failed to delete item. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  function getDaysSince(date: string) {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "DONE":
        return "text-emerald-600"
      case "DOING":
        return "text-blue-600"
      case "TODO":
        return "text-slate-600"
      case "INBOX":
        return "text-amber-600"
      default:
        return "text-slate-500"
    }
  }

  function formatStatus(status: string) {
    return status.replace(/_/g, " ")
  }

  function getDaysInStatus(statusChangedAt: string) {
    return Math.floor((Date.now() - new Date(statusChangedAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Step 2: Follow up on your commands
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Status:
          </h1>
        </header>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading your items...
        </div>
      </div>
    )
  }

  if (accountabilityItems.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Step 2: Follow up on your commands
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Status:
          </h1>
        </header>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No items captured yet.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Step 2: Follow up on your commands
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Status:
        </h1>
      </header>

      <div className="space-y-3">
        {accountabilityItems.map((item) => {
          const daysSinceCreation = getDaysSince(item.createdAt)
          const daysInStatus = getDaysInStatus(item.statusChangedAt)
          const formattedStatus = formatStatus(item.status)

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
                        Status: {formattedStatus}, since {daysInStatus} {daysInStatus === 1 ? "day" : "days"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {daysSinceCreation} {daysSinceCreation === 1 ? "day" : "days"} since creation
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="flex shrink-0 items-center justify-center rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

