export default function HomePage() {
  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">
            Welcome to SSOT
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your AI-powered single source of truth.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Quick Stats", accent: "text-slate-900" },
            { title: "In Progress", accent: "text-amber-600" },
            { title: "Inbox", accent: "text-rose-600" },
            { title: "Completed", accent: "text-emerald-600" }
          ].map(({ title, accent }) => (
            <article
              key={title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-sm font-medium text-slate-500">
                {title}
              </h2>
              <p className={`mt-3 text-2xl font-semibold ${accent}`}>
                Loading…
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Data will appear here once connected.
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

