# Auth System Rewrite: NextAuth → Client-Side Auth

## Goal
Replace NextAuth (server-side) with client-side authentication for offline-first mobile app.

---

## Overview of Changes

### What We're Removing
- NextAuth package and configuration
- API routes at `/api/auth/[...nextauth]`
- Server-side session management

### What We're Adding
- Direct Prisma client queries from frontend
- LocalStorage for session persistence
- Client-side React Context for auth state

---

## Step-by-Step Instructions

### Step 1: Remove NextAuth Dependencies

```bash
npm uninstall next-auth
```

### Step 2: Delete NextAuth API Route

Delete this file:
```
src/app/api/auth/[...nextauth]/route.ts
```

### Step 3: Create Auth Context

Create new file: `src/contexts/AuthContext.tsx`

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PrismaClient, User } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

interface AuthContextType {
  user: User | null
  login: (name: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('wife_app_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      // Find user by name
      const foundUser = await prisma.user.findUnique({
        where: { name }
      })

      if (!foundUser) {
        return false
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, foundUser.password)

      if (!passwordMatch) {
        return false
      }

      // Store user in state and localStorage
      setUser(foundUser)
      localStorage.setItem('wife_app_user', JSON.stringify(foundUser))

      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('wife_app_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Step 4: Update Root Layout

Edit `src/app/layout.tsx`:

```typescript
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Step 5: Create Login Page

Create new file: `src/app/login/page.tsx`

```typescript
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const success = await login(name, password)

    if (success) {
      // Redirect based on role
      router.push('/workflow')
    } else {
      setError('Invalid credentials')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Wife App</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Demo accounts:</p>
          <p>Creator: condor / x</p>
          <p>Wife: estefani / 2122</p>
        </div>
      </div>
    </div>
  )
}
```

### Step 6: Protect Routes with Auth Guard

Create new file: `src/components/AuthGuard.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

### Step 7: Update Protected Pages

For any protected page (workflow, inbox, pwa), wrap the content:

**Example: `src/app/(app)/workflow/page.tsx`**

```typescript
import { AuthGuard } from '@/components/AuthGuard'

export default function WorkflowPage() {
  return (
    <AuthGuard>
      {/* existing page content */}
    </AuthGuard>
  )
}
```

Apply this pattern to:
- `src/app/(app)/workflow/page.tsx`
- `src/app/(app)/inbox/page.tsx`
- `src/app/pwa/capture/page.tsx`

### Step 8: Update Components Using Auth

Find all components that use `useSession()` from NextAuth and replace:

**Before:**
```typescript
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
const user = session?.user
```

**After:**
```typescript
import { useAuth } from '@/contexts/AuthContext'

const { user } = useAuth()
```

### Step 9: Add Logout Button

Add to navigation or settings:

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
    >
      Logout
    </button>
  )
}
```

### Step 10: Handle Prisma Client in Browser

**IMPORTANT:** Prisma Client doesn't work directly in the browser. We have two options:

#### Option A (Recommended): Use Supabase Client Library

Instead of Prisma in the browser, use Supabase's JavaScript client:

```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Update `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://bzcetduznwupsoxzaffl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key_from_supabase_dashboard]
```

Then update `AuthContext.tsx` to use Supabase:

```typescript
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcrypt'

const login = async (name: string, password: string): Promise<boolean> => {
  try {
    // Query Supabase directly
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('name', name)
      .single()

    if (error || !user) {
      return false
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return false
    }

    setUser(user)
    localStorage.setItem('wife_app_user', JSON.stringify(user))

    return true
  } catch (error) {
    console.error('Login error:', error)
    return false
  }
}
```

#### Option B: Keep API Route (Hybrid Approach)

Keep one API route for auth only, disable static export just for that route:

`src/app/api/login/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const { name, password } = await request.json()

  const user = await prisma.user.findUnique({
    where: { name }
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const passwordMatch = await bcrypt.compare(password, user.password)

  if (!passwordMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
```

**However, this defeats the purpose of offline-first, so Option A is strongly recommended.**

---

## Step 11: Remove Static Export Config (Temporarily)

Since we can't use Prisma in browser, we need to either:

1. Use Supabase JS client (recommended) - keeps static export
2. Keep app server-rendered but deploy to Vercel

If using Supabase JS client, keep the static export in `next.config.ts`.

If keeping server-rendered, revert `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  // Remove output: 'export'
  // Remove images: { unoptimized: true }
}
```

---

## Summary of Files to Change

### Delete:
- [ ] `src/app/api/auth/[...nextauth]/route.ts`

### Create:
- [ ] `src/contexts/AuthContext.tsx`
- [ ] `src/app/login/page.tsx`
- [ ] `src/components/AuthGuard.tsx`
- [ ] `src/components/LogoutButton.tsx`
- [ ] `src/lib/supabase.ts` (if using Supabase client)

### Modify:
- [ ] `src/app/layout.tsx` - Add AuthProvider
- [ ] `src/app/(app)/workflow/page.tsx` - Add AuthGuard
- [ ] `src/app/(app)/inbox/page.tsx` - Add AuthGuard
- [ ] `src/app/pwa/capture/page.tsx` - Add AuthGuard
- [ ] Any component using `useSession()` - Replace with `useAuth()`
- [ ] `.env` - Add Supabase public keys

### Commands:
```bash
# Remove NextAuth
npm uninstall next-auth

# Install Supabase client
npm install @supabase/supabase-js
```

---

## Testing Checklist

After making all changes:

1. [ ] Login with creator account (condor / x)
2. [ ] Verify redirect to /workflow
3. [ ] Logout and verify redirect to /login
4. [ ] Login with wife account (estefani / 2122)
5. [ ] Verify session persists after page refresh
6. [ ] Verify protected routes redirect to login when not authenticated

---

## Recommended Approach

**Use Supabase JavaScript Client (Option A)**

This gives you:
- True client-side authentication
- Offline-first capability with localStorage
- Static export for Capacitor
- Direct database queries from browser
- No API routes needed

---

## Questions?

If you get stuck on any step, ask me and I'll help debug or provide more specific code for your files.
