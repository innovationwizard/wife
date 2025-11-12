"use client"

import { useEffect, useState } from "react"
import { BookOpen, Calendar, Tag } from "lucide-react"

interface Item {
  id: string
  title: string
  rawInstructions: string
  labels: string[]
  createdAt: string
}

export default function LibraryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLibrary()
  }, [])

  async function loadLibrary() {
    setLoading(true)
    try {
      const response = await fetch("/api/items?status=LIBRARY")
      const data: Item[] = await response.json()
      setItems(data)
      setSelected((current) =>
        current ? data.find((item) => item.id === current.id) ?? null : null
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-8 py-10">
      <div className="space-y-6">
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <BookOpen className="h-5 w-5 text-slate-500" />
            Knowledge Library
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Reference material and context captured during work.
          </p>
        </header>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading library…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
            <aside className="space-y-2">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Nothing saved yet.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={[
                      "w-full rounded-md border px-4 py-3 text-left text-sm shadow-sm transition-colors",
                      selected?.id === item.id
                        ? "border-slate-400 bg-slate-100 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                    ].join(" ")}
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                      {item.labels.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {item.labels.join(", ")}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </aside>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              {selected ? (
                <>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selected.title}
                  </h2>
                  <div className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
                    {selected.rawInstructions}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Select an item to read its details.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

