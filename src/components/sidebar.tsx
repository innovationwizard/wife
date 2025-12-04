"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  PenSquare,
  Layout as LayoutIcon,
  Home,
  LogOut,
  User,
  Heart,
  Settings,
  X
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
  { href: "/capture", label: "Capture", icon: PenSquare },
  { href: "/workflow", label: "Workflow", icon: LayoutIcon },
  { href: "/", label: "Overview", icon: Home }
]

interface SidebarProps {
  user?: {
    name?: string | null
    role?: string | null
  }
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ user, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  function handleSignOut() {
    logout()
    router.push("/login")
  }

  function handleLinkClick() {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen w-64 flex-col border-r bg-white transition-transform duration-300 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between border-b px-6 py-4 md:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
              <Heart className="h-5 w-5 text-rose-600" strokeWidth={1.5} />
            </span>
            <div>
              <div className="text-xs font-semibold tracking-wide text-slate-500">
                Wife App
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Task Management
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop header */}
        <div className="hidden items-center gap-3 px-6 py-5 md:flex">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
            <Heart className="h-6 w-6 text-rose-600" strokeWidth={1.5} />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-500">
              Wife App
            </div>
            <div className="text-lg font-semibold text-slate-900">
              Task Management
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/"
                  ? pathname === href
                  : pathname?.startsWith(href)

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={handleLinkClick}
                    className={[
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors min-h-[48px]",
                      isActive
                        ? "bg-slate-100 text-slate-900 font-medium"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 shrink-0">
              <User className="h-4 w-4 text-slate-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-900">
                {user?.name ?? "Signed in"}
              </div>
              {user?.role && (
                <div className="truncate text-xs text-slate-500">
                  {user.role}
                </div>
              )}
            </div>
          </div>
          <Link
            href="/account"
            onClick={handleLinkClick}
            className={[
              "flex w-full items-center gap-2 rounded-md px-3 py-3 text-sm transition-colors min-h-[48px]",
              pathname === "/account"
                ? "bg-slate-100 text-slate-900 font-medium"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            ].join(" ")}
          >
            <Settings className="h-4 w-4" />
            Account
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 min-h-[48px]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
