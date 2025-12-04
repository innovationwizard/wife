"use client"

import { useState, useEffect } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult
} from "@hello-pangea/dnd"
import { AlertTriangle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useItems, updateItem, Item } from "@/hooks/useItems"
import { ItemStatus, Swimlane } from "@prisma/client"

interface ColumnConfig {
  title: string
  color: string
  wipLimit?: number
}

const COLUMNS: Record<string, ColumnConfig> = {
  BACKLOG: { title: "Backlog", color: "bg-slate-200" },
  TODO: { title: "To Do", color: "bg-slate-100" },
  DOING: { title: "Doing", color: "bg-blue-100", wipLimit: 1 },
  IN_REVIEW: { title: "In Review", color: "bg-amber-100" },
  BLOCKED: { title: "Blocked", color: "bg-rose-100" },
  DONE: { title: "Done", color: "bg-emerald-100" }
}

// Column order from left to right
const COLUMN_ORDER = ["BACKLOG", "TODO", "DOING", "IN_REVIEW", "BLOCKED", "DONE"]

const SWIMLANES = ["EXPEDITE", "PROJECT", "HABIT", "HOME"]

const PRIORITY_BORDERS = {
  HIGH: "border-rose-500",
  MEDIUM: "border-amber-500",
  LOW: "border-slate-300"
}

export default function WorkflowPage() {
  const { user } = useAuth()
  const { items: fetchedItems, loading } = useItems()
  const [dragError, setDragError] = useState("")
  const [localItems, setLocalItems] = useState<Item[]>([])

  // Filter items to only workflow statuses
  const workflowStatuses: ItemStatus[] = [ItemStatus.BACKLOG, ItemStatus.TODO, ItemStatus.DOING, ItemStatus.IN_REVIEW, ItemStatus.BLOCKED, ItemStatus.DONE]
  const filteredItems = fetchedItems.filter(item => workflowStatuses.includes(item.status))
  
  // Sync local items with fetched items
  useEffect(() => {
    if (filteredItems.length > 0) {
      setLocalItems(filteredItems)
    }
  }, [filteredItems])
  
  const items = localItems.length > 0 ? localItems : filteredItems

  function daysSince(date: string) {
    const delta = Date.now() - new Date(date).getTime()
    return Math.floor(delta / (1000 * 60 * 60 * 24))
  }

  function itemsBy(status: string, swimlane: string) {
    const filtered = items.filter((item) => item.status === status && item.swimlane === swimlane)

    return filtered.sort((a, b) => {
      // Use database order if available (items with order come first, sorted by order)
      // Items without order (null) come after, sorted by priority/date
      const aHasOrder = a.order !== null && a.order !== undefined
      const bHasOrder = b.order !== null && b.order !== undefined
      
      if (aHasOrder && bHasOrder) {
        // Both have order - sort by order
        return (a.order ?? Infinity) - (b.order ?? Infinity)
      } else if (aHasOrder && !bHasOrder) {
        // a has order, b doesn't - a comes first
        return -1
      } else if (!aHasOrder && bHasOrder) {
        // b has order, a doesn't - b comes first
        return 1
      }
      
      // Neither has order - fallback to priority and date sorting
      const priorityOrder: Record<string, number> = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2
      }
      const aPriority = a.priority || 'LOW'
      const bPriority = b.priority || 'LOW'
      const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority]
      if (priorityDiff !== 0) return priorityDiff
      return (
        new Date(a.statusChangedAt).getTime() -
        new Date(b.statusChangedAt).getTime()
      )
    })
  }

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result

    setDragError("")

    if (!destination) return

    const item = items.find((entry) => entry.id === draggableId)
    if (!item) return

    // Parse source droppableId
    const sourceParts = source.droppableId.split("-")
    const sourceStatus = sourceParts.slice(0, -1).join("-")
    const sourceSwimlane = sourceParts[sourceParts.length - 1]

    // Same column and swimlane - reorder within column
    if (source.droppableId === destination.droppableId) {
      const sameColumnItems = itemsBy(sourceStatus, sourceSwimlane)
      const sourceIndex = source.index
      const destIndex = destination.index

      if (sourceIndex === destIndex) return

      // Reorder items locally
      const reordered = Array.from(sameColumnItems)
      const [removed] = reordered.splice(sourceIndex, 1)
      reordered.splice(destIndex, 0, removed)

      // Update local state optimistically
      setLocalItems((prev) => {
        const otherItems = prev.filter(
          (entry) => !(entry.status === sourceStatus && entry.swimlane === sourceSwimlane)
        )
        return [...otherItems, ...reordered]
      })

      // Persist order to database - update all items in this column/swimlane
      if (!user) return
      
      try {
        const updatePromises = reordered.map((item, index) =>
          updateItem({
            id: item.id,
            userId: user.id,
            data: { order: index }
          })
        )
        await Promise.all(updatePromises)
      } catch (error) {
        console.error("Failed to persist order", error)
      }

      return
    }

    // Different column - move between columns
    // Parse droppableId: format is "STATUS-SWIMLANE" (e.g., "DOING-EXPEDITE", "DONE-PROJECT")
    // For statuses with underscores like "IN_REVIEW", we need to handle splitting correctly
    const destParts = destination.droppableId.split("-")
    // Status is everything except the last part (swimlane)
    const nextStatus = destParts.slice(0, -1).join("-")
    const destSwimlane = destParts[destParts.length - 1]

    console.log("[Workflow] Moving item:", {
      from: source.droppableId,
      to: destination.droppableId,
      nextStatus,
      destSwimlane,
      itemId: draggableId
    })

    if (nextStatus === "DOING") {
      const inDoing = items.filter((entry) => entry.status === "DOING")
      if (inDoing.length >= 1) {
        setDragError("Only one item can be in Doing at a time.")
        setTimeout(() => setDragError(""), 3000)
        return
      }
    }

    if (!user) return

    // Optimistically update UI
    setLocalItems((prev) =>
      prev.map((entry) =>
        entry.id === draggableId
          ? {
              ...entry,
              status: nextStatus as ItemStatus,
              swimlane: destSwimlane as Swimlane,
              statusChangedAt: new Date().toISOString(),
              order: null // Clear order when moving between columns
            }
          : entry
      )
    )

    try {
      await updateItem({
        id: draggableId,
        userId: user.id,
        data: { 
          status: nextStatus as ItemStatus,
          swimlane: destSwimlane as Swimlane,
          order: null // Clear order when moving between columns
        }
      })
      console.log("[Workflow] Successfully moved item to", nextStatus)
    } catch (error) {
      console.error("[Workflow] Failed to update item", error)
      setDragError("Failed to move item. Please try again.")
      setTimeout(() => setDragError(""), 3000)
      // Revert optimistic update on error
      setLocalItems(filteredItems)
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading workflow…
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Workflow</h1>
            {dragError && (
              <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {dragError}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 py-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid min-w-[1320px] grid-cols-6 gap-4">
            {COLUMN_ORDER.map((status) => {
              const config = COLUMNS[status]
              if (!config) return null
              return (
                <section key={status} className="flex flex-col">
                <div
                  className={`rounded-t-md px-3 py-2 text-sm font-medium text-slate-700 ${config.color}`}
                >
                  {config.title}
                  {config.wipLimit && (
                    <span className="ml-2 text-xs text-slate-500">
                      ({items.filter((item) => item.status === status).length}/
                      {config.wipLimit})
                    </span>
                  )}
                </div>
                <div className="flex-1 rounded-b-md border border-t-0 border-slate-200 bg-slate-50">
                  {SWIMLANES.map((swimlane) => (
                    <Droppable
                      key={`${status}-${swimlane}`}
                      droppableId={`${status}-${swimlane}`}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[120px] border-b border-slate-200 p-3 last:border-b-0 ${
                            snapshot.isDraggingOver ? "bg-slate-100" : ""
                          }`}
                        >
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {swimlane}
                          </p>
                          {itemsBy(status, swimlane).map((item, index) => {
                            const age = daysSince(item.statusChangedAt)
                            const isStale =
                              (item.swimlane === "EXPEDITE" && age > 1) ||
                              (item.priority === "HIGH" && age > 3) ||
                              age > 7

                            return (
                              <Draggable
                                key={item.id}
                                draggableId={item.id}
                                index={index}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <article
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className={[
                                      "mb-2 rounded-md border-l-4 bg-white p-3 shadow-sm",
                                      PRIORITY_BORDERS[item.priority || 'LOW'],
                                      dragSnapshot.isDragging
                                        ? "shadow-lg"
                                        : "",
                                      isStale ? "ring-2 ring-amber-400" : ""
                                    ].join(" ")}
                                  >
                                    <div className="text-sm font-medium text-slate-900">
                                      {item.title}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                      <span>#{item.humanId.slice(0, 6)}</span>
                                      <span className="flex items-center gap-2">
                                        {isStale && (
                                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                                        )}
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {age}d
                                        </span>
                                      </span>
                                    </div>
                                    {item.labels && item.labels.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {item.labels.map((label) => (
                                          <span
                                            key={label}
                                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                          >
                                            {label}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="mt-2 text-xs text-slate-600 italic">
                                        {item.notes}
                                      </div>
                                    )}
                                  </article>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </section>
            )})}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}

