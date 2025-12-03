import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ItemStatus, ItemType, Priority, Swimlane } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { status, type, routingNotes, title, rawInstructions, notes, swimlane, priority, labels, order } = await request.json()

  if (!status && !type && typeof routingNotes === "undefined" && !title && !rawInstructions && typeof notes === "undefined" && !swimlane && !priority && !labels && typeof order === "undefined") {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    )
  }

  const existing = await prisma.item.findFirst({
    where: {
      id,
      createdByUserId: session.user.id
    }
  })

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  if (status) {
    data.status = status as ItemStatus
    data.statusChangedAt = new Date()
    
    // Track timestamps for status changes
    if (status === ItemStatus.DOING && !existing.startedAt) {
      data.startedAt = new Date()
    }
    if (status === ItemStatus.DONE && !existing.completedAt) {
      data.completedAt = new Date()
    }
    if (status === ItemStatus.BLOCKED && !existing.blockedAt) {
      data.blockedAt = new Date()
    }
  }

  if (type) {
    data.type = type as ItemType
  }

  if (typeof routingNotes !== "undefined") {
    const cleaned =
      typeof routingNotes === "string"
        ? routingNotes.trim()
        : routingNotes == null
          ? null
          : String(routingNotes).trim()
    data.routingNotes = cleaned || null
  }

  if (typeof notes !== "undefined") {
    const cleaned =
      typeof notes === "string"
        ? notes.trim()
        : notes == null
          ? null
          : String(notes).trim()
    data.notes = cleaned || null
  }

  if (title) {
    const trimmed = typeof title === "string" ? title.trim() : String(title).trim()
    if (!trimmed) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      )
    }
    data.title = trimmed
  }

  if (rawInstructions !== undefined) {
    const cleaned = typeof rawInstructions === "string" ? rawInstructions.trim() : String(rawInstructions).trim()
    data.rawInstructions = cleaned
  }

  if (swimlane) {
    data.swimlane = swimlane as Swimlane
  }

  if (priority) {
    data.priority = priority as Priority
  }

  if (labels) {
    data.labels = labels
  }

  if (typeof order !== "undefined") {
    data.order = order === null ? null : (typeof order === "number" ? order : parseInt(String(order), 10))
  }

  const previousStatus = existing.status
  const newStatus = status ? (status as ItemStatus) : previousStatus

  const item = await prisma.item.update({
    where: { id },
    data
  })

  // Create status change record
  if (status && previousStatus !== newStatus) {
    await prisma.statusChange.create({
      data: {
        itemId: item.id,
        fromStatus: previousStatus,
        toStatus: newStatus,
        changedById: session.user.id
      }
    })
  }

  return NextResponse.json(item)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.item.findFirst({
    where: {
      id,
      createdByUserId: session.user.id,
      status: ItemStatus.ARCHIVE // Only allow deletion of archived items
    }
  })

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.item.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
