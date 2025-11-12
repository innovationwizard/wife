"use client"

import { useEffect, useMemo, useState } from "react"

interface InboxItem {
  id: string
  title: string
  rawInstructions: string
  capturedBy?: {
    email: string | null
  } | null
  routingNotes?: string | null
}

interface ProjectSummary {
  id: string
  title: string
  status: string
}

export default function CleanPage() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    void fetchItems()
    void fetchProjects()
  }, [])

  async function fetchItems() {
    setLoadingItems(true)
    try {
      const response = await fetch("/api/items?status=INBOX", {
        cache: "no-store"
      })
      if (!response.ok) throw new Error("Failed to load inbox")
      const data: InboxItem[] = await response.json()
      setItems(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingItems(false)
    }
  }

  async function fetchProjects() {
    setLoadingProjects(true)
    try {
      const response = await fetch("/api/projects", { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to load projects")
      const data: ProjectSummary[] = await response.json()
      setProjects(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const currentItem = useMemo(() => items[0] ?? null, [items])

  useEffect(() => {
    setConfirmation(null)
    setInstructions(currentItem?.routingNotes ?? "")
  }, [currentItem?.id, currentItem?.routingNotes])

  async function handleAssign(projectId: string, options?: { skipGuard?: boolean }) {
    if (!currentItem || (assigning && !options?.skipGuard)) return

    setAssigning(true)
    setConfirmation(null)

    try {
      const response = await fetch(`/api/items/${currentItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, routingNotes: instructions })
      })

      if (!response.ok) {
        throw new Error("Failed to assign project")
      }

      const projectTitle =
        projects.find((project) => project.id === projectId)?.title ?? "project"

      setConfirmation(`Routed to ${projectTitle}`)
      setItems((prev) => prev.slice(1))
      setInstructions("")
    } catch (error) {
      console.error(error)
    } finally {
      setAssigning(false)
    }
  }

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newProjectTitle.trim()) return

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newProjectTitle.trim() })
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      const project: ProjectSummary = await response.json()
      setProjects((prev) => [...prev, project])
      setCreatingProject(false)
      setNewProjectTitle("")
      await handleAssign(project.id, { skipGuard: true })
    } catch (error) {
      console.error(error)
    }
  }

  if (loadingItems) {
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
            Everything captured has been routed. Proceed to the next step when ready.
          </p>
        </div>
      </div>
    )
  }

  const capturedByLabel = currentItem.capturedBy?.email ?? "Creator"

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Step 3 · Route
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Decide where this belongs
          </h1>
          <p className="text-sm text-slate-500">
            Items flagged as actionable move here next. Assign each one to the right project before evaluating urgency.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Captured by {capturedByLabel}
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {currentItem.title}
            </h2>
            <p className="min-h-[120px] whitespace-pre-wrap text-sm text-slate-700">
              {currentItem.rawInstructions}
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Route: Which project owns this?
            </p>

            {loadingProjects ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Loading projects…
              </div>
            ) : projects.length > 0 ? (
              <ul className="space-y-2">
                {projects.map((project) => (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => handleAssign(project.id)}
                      disabled={assigning}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                    >
                      <span className="font-medium text-slate-900">{project.title}</span>
                      <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">
                        {project.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No projects found yet. Create one below to route this item.
              </div>
            )}

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Optional instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Add context, clarifications, or instructions for next steps"
                  rows={4}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/60 p-4">
                {creatingProject ? (
                  <form onSubmit={handleCreateProject} className="space-y-3">
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(event) => setNewProjectTitle(event.target.value)}
                      placeholder="Project name"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={assigning}
                        className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        Create & assign
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingProject(false)
                          setNewProjectTitle("")
                        }}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreatingProject(true)}
                    className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    + Create new project
                  </button>
                )}
              </div>
            </div>
          </div>

          {confirmation && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {confirmation}
            </div>
          )}
        </section>

        {items.length > 1 && (
          <p className="text-xs text-slate-400">
            {items.length - 1} additional item{items.length - 1 === 1 ? "" : "s"} waiting to be routed.
          </p>
        )}
      </div>
    </div>
  )
}

