# Supabase Migration Guide: API Routes → Client + Edge Functions

## Goal
Remove all Next.js API routes and replace with:
- **Supabase JS Client** for direct database queries (90% of operations)
- **Supabase Edge Functions** for server-side operations like password hashing (10%)

This enables true offline-first with static export for Capacitor mobile apps.

---

## Architecture Overview

### Before (Current)
```
Frontend → Next.js API Routes → Prisma → Supabase PostgreSQL
```

### After (Target)
```
Frontend → Supabase JS Client → Supabase PostgreSQL
Frontend → Supabase Edge Functions → Supabase PostgreSQL (for auth only)
```

---

## Part 1: Setup Supabase Client

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Get Supabase Credentials

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project (bzcetduznwupsoxzaffl)
3. Go to Settings → API
4. Copy:
   - **Project URL**: `https://bzcetduznwupsoxzaffl.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`

### Step 3: Add Environment Variables

Update `.env`:
```bash
# Keep existing
DATABASE_URL=postgresql://postgres.bzcetduznwupsoxzaffl:BARW7p4LO7nsMPkg@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Add new (for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://bzcetduznwupsoxzaffl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 5: Enable Row Level Security (RLS)

Supabase requires RLS policies for security. In Supabase dashboard:

1. Go to Table Editor
2. For each table (User, Item, StatusChange), click the table
3. Go to "RLS" tab
4. Click "Enable RLS"
5. Add policies (see Part 2 below)

---

## Part 2: Configure Row Level Security Policies

Supabase uses PostgreSQL Row Level Security to control data access.

### Policy 1: Users Table

```sql
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON "User"
FOR SELECT
USING (auth.uid()::text = id::text);

-- Allow users to read all users (needed for finding creator)
CREATE POLICY "Users can read all users"
ON "User"
FOR SELECT
USING (true);

-- Allow users to update their own password
CREATE POLICY "Users can update own data"
ON "User"
FOR UPDATE
USING (auth.uid()::text = id::text);
```

**WAIT!** Problem: We're not using Supabase Auth (we have custom User table with passwords).

**Solution**: We need to either:
- **Option A**: Disable RLS and handle security client-side (simpler, less secure)
- **Option B**: Migrate to Supabase Auth (more work, more secure)
- **Option C**: Use service role key (bypasses RLS, use carefully)

**Recommendation**: For mobile app with offline-first, use **Option C** with service role key, but store it securely.

### Alternative: Disable RLS (Simpler for MVP)

For each table:
```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "StatusChange" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Rule" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemMessage" DISABLE ROW LEVEL SECURITY;
```

**Security Note**: This means anyone with your anon key can read/write data. For production, you'll want proper RLS policies. For MVP launch, this is acceptable if you:
1. Don't expose anon key publicly
2. Add app-level auth checks
3. Plan to migrate to Supabase Auth later

---

## Part 3: Migrate Authentication

### Challenge: Password Hashing

- `bcrypt` only works in Node.js (not browser)
- Options:
  1. Use Supabase Edge Function for login/password change
  2. Use browser-compatible hash (argon2-browser, scrypt-js)
  3. Migrate to Supabase Auth

**Recommended**: Use **Supabase Edge Function** for auth operations.

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Initialize Supabase Functions

```bash
supabase login
supabase init
supabase functions new login
supabase functions new change-password
```

### Step 3: Create Login Edge Function

File: `supabase/functions/login/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, password } = await req.json()

    if (!name || !password) {
      return new Response(
        JSON.stringify({ error: 'Name and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find user
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('name', name)
      .single()

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return user (without password)
    return new Response(
      JSON.stringify({
        id: user.id,
        name: user.name,
        role: user.role
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 4: Create Change Password Edge Function

File: `supabase/functions/change-password/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, currentPassword, newPassword } = await req.json()

    if (!userId || !currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (newPassword.trim().length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword.trim())

    // Update password
    const { error: updateError } = await supabase
      .from('User')
      .update({ password: hashed })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 5: Deploy Edge Functions

```bash
supabase functions deploy login
supabase functions deploy change-password
```

You'll get URLs like:
```
https://bzcetduznwupsoxzaffl.supabase.co/functions/v1/login
https://bzcetduznwupsoxzaffl.supabase.co/functions/v1/change-password
```

---

## Part 4: Rewrite Frontend Code

### Update AuthContext

File: `src/contexts/AuthContext.tsx`

**Replace the login function:**

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@prisma/client'

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1'

interface AuthContextType {
  user: Omit<User, 'password'> | null
  login: (name: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('wife_app_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        },
        body: JSON.stringify({ name, password })
      })

      if (!response.ok) {
        return false
      }

      const userData = await response.json()
      setUser(userData)
      localStorage.setItem('wife_app_user', JSON.stringify(userData))

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

### Create Items Hook

File: `src/hooks/useItems.ts`

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Item, ItemStatus, ItemType, Priority, Swimlane, Role } from '@prisma/client'

export function useItems(options?: {
  status?: ItemStatus
  capturedBy?: 'me'
}) {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchItems() {
      try {
        setLoading(true)

        let query = supabase
          .from('Item')
          .select('*, capturedBy:capturedByUserId(name)')

        // Filter by owner or capturer
        if (options?.capturedBy === 'me') {
          query = query.eq('capturedByUserId', user.id)
        } else {
          query = query.eq('createdByUserId', user.id)
        }

        // Filter by status
        if (options?.status) {
          query = query.eq('status', options.status)
        }

        query = query.order('createdAt', { ascending: false })

        const { data, error } = await query

        if (error) throw error

        // Ensure statusChangedAt fallback
        const itemsWithStatus = (data || []).map(item => ({
          ...item,
          statusChangedAt: item.statusChangedAt || item.createdAt
        }))

        setItems(itemsWithStatus as Item[])
      } catch (err) {
        console.error('Error fetching items:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch items')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [user, options?.status, options?.capturedBy])

  return { items, loading, error, refetch: () => {} }
}

export async function createItem(params: {
  user: { id: string; role: Role }
  content: string
  title?: string
  status?: ItemStatus
  type?: ItemType
}) {
  const { user, content, title, status, type } = params

  if (!content.trim()) {
    throw new Error('Content is required')
  }

  // Determine owner
  let ownerUserId = user.id

  if (user.role !== 'CREATOR') {
    const { data: creator } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'CREATOR')
      .single()

    if (!creator) {
      throw new Error('No creator account configured')
    }

    ownerUserId = creator.id
  }

  // Derive title
  const derivedTitle =
    title ||
    content
      .split(/\n+/)
      .map(segment => segment.trim())
      .filter(Boolean)[0]
      ?.slice(0, 80) ||
    'Captured idea'

  const itemStatus = status || ItemStatus.INBOX
  const itemType = type === 'INFO' ? ItemType.INFO : undefined

  // Create item
  const { data: item, error: itemError } = await supabase
    .from('Item')
    .insert({
      title: derivedTitle,
      rawInstructions: content,
      status: itemStatus,
      type: itemType,
      createdByUserId: ownerUserId,
      capturedByUserId: user.id,
      statusChangedAt: new Date().toISOString()
    })
    .select()
    .single()

  if (itemError) throw itemError

  // Create status history
  const { error: historyError } = await supabase
    .from('StatusChange')
    .insert({
      itemId: item.id,
      toStatus: itemStatus,
      changedById: user.id
    })

  if (historyError) console.error('Failed to create status history:', historyError)

  return item
}

export async function updateItem(params: {
  id: string
  userId: string
  data: {
    status?: ItemStatus
    type?: ItemType
    routingNotes?: string | null
    title?: string
    rawInstructions?: string
    notes?: string | null
    swimlane?: Swimlane
    priority?: Priority
    labels?: string[]
    order?: number | null
  }
}) {
  const { id, userId, data } = params

  // Verify ownership
  const { data: existing } = await supabase
    .from('Item')
    .select('*')
    .eq('id', id)
    .eq('createdByUserId', userId)
    .single()

  if (!existing) {
    throw new Error('Item not found')
  }

  const updateData: Record<string, any> = {}

  if (data.status) {
    updateData.status = data.status
    updateData.statusChangedAt = new Date().toISOString()

    // Track timestamps
    if (data.status === ItemStatus.DOING && !existing.startedAt) {
      updateData.startedAt = new Date().toISOString()
    }
    if (data.status === ItemStatus.DONE && !existing.completedAt) {
      updateData.completedAt = new Date().toISOString()
    }
    if (data.status === ItemStatus.BLOCKED && !existing.blockedAt) {
      updateData.blockedAt = new Date().toISOString()
    }
  }

  if (data.type !== undefined) updateData.type = data.type
  if (data.routingNotes !== undefined) updateData.routingNotes = data.routingNotes
  if (data.title !== undefined) updateData.title = data.title
  if (data.rawInstructions !== undefined) updateData.rawInstructions = data.rawInstructions
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.swimlane !== undefined) updateData.swimlane = data.swimlane
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.labels !== undefined) updateData.labels = data.labels
  if (data.order !== undefined) updateData.order = data.order

  const { data: item, error } = await supabase
    .from('Item')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Create status change record
  if (data.status && existing.status !== data.status) {
    await supabase
      .from('StatusChange')
      .insert({
        itemId: id,
        fromStatus: existing.status,
        toStatus: data.status,
        changedById: userId
      })
  }

  return item
}

export async function deleteItem(id: string, userId: string) {
  // Verify item is archived and owned by user
  const { data: existing } = await supabase
    .from('Item')
    .select('*')
    .eq('id', id)
    .eq('createdByUserId', userId)
    .eq('status', ItemStatus.ARCHIVE)
    .single()

  if (!existing) {
    throw new Error('Item not found or not archived')
  }

  const { error } = await supabase
    .from('Item')
    .delete()
    .eq('id', id)

  if (error) throw error

  return { success: true }
}
```

### Update Components

Replace all `apiFetch()` calls with direct Supabase queries or the hooks above.

**Example: Inbox Page**

Before:
```typescript
const response = await apiFetch('/api/items?status=INBOX')
const items = await response.json()
```

After:
```typescript
import { useItems } from '@/hooks/useItems'

const { items, loading } = useItems({ status: 'INBOX' })
```

**Example: Create Item**

Before:
```typescript
await apiFetch('/api/items', {
  method: 'POST',
  body: JSON.stringify({ content, status })
})
```

After:
```typescript
import { createItem } from '@/hooks/useItems'
import { useAuth } from '@/contexts/AuthContext'

const { user } = useAuth()
await createItem({ user: user!, content, status })
```

---

## Part 5: Remove API Routes

Once all components are updated, delete:

```bash
rm -rf src/app/api/
```

Also remove `src/lib/api-auth.ts` and `src/lib/api-fetch.ts` if they exist.

---

## Part 6: Test Static Export

```bash
npm run build
```

Should succeed with no errors about API routes.

---

## Part 7: Update Capacitor Config

File: `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/core'

const config: CapacitorConfig = {
  appId: 'com.wifeapp.mobile',
  appName: 'Wife App',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
}

export default config
```

---

## Migration Checklist

### Setup
- [ ] Install `@supabase/supabase-js`
- [ ] Get Supabase URL and anon key
- [ ] Add to `.env` as `NEXT_PUBLIC_*`
- [ ] Create `src/lib/supabase.ts`
- [ ] Disable RLS on all tables (or configure policies)

### Edge Functions
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Initialize: `supabase init`
- [ ] Create login function
- [ ] Create change-password function
- [ ] Deploy both functions
- [ ] Test functions with curl/Postman

### Frontend Code
- [ ] Update `AuthContext.tsx` to use Edge Function for login
- [ ] Create `src/hooks/useItems.ts` with Supabase queries
- [ ] Update all components using `/api/items`
- [ ] Update all components using `/api/workflow/items`
- [ ] Update password change to use Edge Function
- [ ] Remove `apiFetch` utility
- [ ] Remove `getAuthUser` utility

### Cleanup
- [ ] Delete `src/app/api/` directory
- [ ] Delete `src/lib/api-auth.ts`
- [ ] Delete `src/lib/api-fetch.ts`
- [ ] Test: `npm run build` succeeds
- [ ] Test: Login works
- [ ] Test: Create item works
- [ ] Test: Update item works
- [ ] Test: Workflow Kanban works

### Capacitor
- [ ] Build: `npm run build`
- [ ] Sync: `npx cap sync`
- [ ] Test iOS: `npx cap open ios`
- [ ] Test Android: `npx cap open android`

---

## Testing Guide

### Test Login
```typescript
const response = await fetch('https://bzcetduznwupsoxzaffl.supabase.co/functions/v1/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'your_anon_key'
  },
  body: JSON.stringify({
    name: 'condor',
    password: 'x'
  })
})

console.log(await response.json())
// Should return: { id: '...', name: 'condor', role: 'CREATOR' }
```

### Test Create Item
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('Item')
  .insert({
    title: 'Test task',
    rawInstructions: 'Test content',
    status: 'INBOX',
    createdByUserId: 'creator_user_id',
    capturedByUserId: 'creator_user_id',
    statusChangedAt: new Date().toISOString()
  })
  .select()
  .single()

console.log(data, error)
```

---

## Common Issues

### Issue: "relation does not exist"
**Cause**: Table names are case-sensitive in Supabase
**Fix**: Use exact table names from Prisma schema: `User`, `Item`, `StatusChange`

### Issue: "Failed to fetch"
**Cause**: CORS or network issue
**Fix**: Check Edge Function CORS headers, verify Supabase URL

### Issue: "Row Level Security policy violation"
**Cause**: RLS is enabled but no policies allow access
**Fix**: Either disable RLS or create proper policies

### Issue: "Cannot read password hash"
**Cause**: Using anon key to query password field
**Fix**: Use Edge Functions for auth operations

---

## Estimated Time

- **Setup**: 30 minutes
- **Edge Functions**: 1 hour
- **Frontend migration**: 2-3 hours
- **Testing**: 1 hour
- **Total**: 4-5 hours

---

## Need Help?

If you get stuck:
1. Check Supabase logs: Dashboard → Logs → Edge Functions
2. Check browser console for errors
3. Test Edge Functions directly with curl
4. Ask me for help with specific error messages

---

## Next Steps After Migration

Once this is complete:
1. ✅ Static export will work
2. ✅ Capacitor build will succeed
3. ✅ App will work offline (after initial data load)
4. ✅ Ready for iOS/Android testing
5. ✅ Ready for App Store submission
