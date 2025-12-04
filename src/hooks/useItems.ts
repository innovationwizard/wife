import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ItemStatus, ItemType, Priority, Swimlane, Role } from '@prisma/client'

// Generate a CUID-like ID (simple implementation compatible with Prisma's cuid format)
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

export interface Item {
  id: string
  humanId: string
  title: string
  rawInstructions: string
  notes?: string | null
  status: ItemStatus
  priority?: Priority | null
  swimlane?: Swimlane | null
  labels?: string[] | null
  createdAt: string
  statusChangedAt: string
  order?: number | null
  createdByUserId: string
  capturedByUserId: string
  capturedBy?: {
    name: string | null
  } | null
}

export function useItems(options?: {
  status?: ItemStatus
  capturedBy?: 'me'
}) {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setItems([])
      return
    }

    async function fetchItems() {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('Item')
          .select('*, capturedBy:capturedByUserId(name)')

        // Filter by owner or capturer
        if (options?.capturedBy === 'me') {
          query = query.eq('capturedByUserId', user!.id)
        } else {
          query = query.eq('createdByUserId', user!.id)
        }

        // Filter by status
        if (options?.status) {
          query = query.eq('status', options.status)
        }

        query = query.order('createdAt', { ascending: false })

        const { data, error: queryError } = await query

        if (queryError) throw queryError

        // Ensure statusChangedAt fallback
        const itemsWithStatus = (data || []).map((item: any) => ({
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

  const refetch = async () => {
    if (!user) {
      setItems([])
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('Item')
        .select('*, capturedBy:capturedByUserId(name)')

      // Filter by owner or capturer
      if (options?.capturedBy === 'me') {
        query = query.eq('capturedByUserId', user!.id)
      } else {
        query = query.eq('createdByUserId', user!.id)
      }

      // Filter by status
      if (options?.status) {
        query = query.eq('status', options.status)
      }

      query = query.order('createdAt', { ascending: false })

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      // Ensure statusChangedAt fallback
      const itemsWithStatus = (data || []).map((item: any) => ({
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

  return { items, loading, error, refetch }
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

  if (user.role !== 'HUSBAND') {
    const { data: husband, error: husbandError } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'HUSBAND')
      .single()

    if (husbandError || !husband) {
      throw new Error('No husband account configured')
    }

    ownerUserId = husband.id
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

  // Generate IDs (required when using Supabase directly, as Prisma defaults don't apply)
  const id = generateId()
  const humanId = generateId()

  // Create item
  const { data: item, error: itemError } = await supabase
    .from('Item')
    .insert({
      id,
      humanId,
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
  const statusChangeId = generateId()
  const { error: historyError } = await supabase
    .from('StatusChange')
    .insert({
      id: statusChangeId,
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
  const { data: existing, error: fetchError } = await supabase
    .from('Item')
    .select('*')
    .eq('id', id)
    .eq('createdByUserId', userId)
    .single()

  if (fetchError || !existing) {
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
    const statusChangeId = generateId()
    await supabase
      .from('StatusChange')
      .insert({
        id: statusChangeId,
        itemId: id,
        fromStatus: existing.status,
        toStatus: data.status,
        changedById: userId
      })
  }

  return item
}

export async function deleteItem(params: {
  id: string
  userId: string
  userRole: 'HUSBAND' | 'WIFE'
}) {
  const { id, userId, userRole } = params

  // Wives can delete any item (they captured)
  // Husbands can only delete archived items they own
  if (userRole === 'WIFE') {
    // Verify item was captured by this wife
    const { data: existing, error: fetchError } = await supabase
      .from('Item')
      .select('*')
      .eq('id', id)
      .eq('capturedByUserId', userId)
      .single()

    if (fetchError || !existing) {
      throw new Error('Item not found or you do not have permission to delete it')
    }
  } else {
    // Husband: verify item is archived and owned by user
    const { data: existing, error: fetchError } = await supabase
      .from('Item')
      .select('*')
      .eq('id', id)
      .eq('createdByUserId', userId)
      .eq('status', ItemStatus.ARCHIVE)
      .single()

    if (fetchError || !existing) {
      throw new Error('Item not found or not archived')
    }
  }

  const { error } = await supabase
    .from('Item')
    .delete()
    .eq('id', id)

  if (error) throw error

  return { success: true }
}

