import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ItemStatus, Role } from "@prisma/client"

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json()
  const content = typeof payload?.content === "string" ? payload.content.trim() : ""
  const explicitTitle = typeof payload?.title === "string" ? payload.title.trim() : ""

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const sessionUserId = session.user.id
  const sessionRole = session.user.role

  let ownerUserId = sessionUserId

  if (sessionRole !== Role.CREATOR) {
    const creatorUser = await prisma.user.findFirst({
      where: { role: Role.CREATOR }
    })

    if (!creatorUser) {
      return NextResponse.json(
        { error: "No creator account configured" },
        { status: 500 }
      )
    }

    ownerUserId = creatorUser.id
  }

  const derivedTitle =
    explicitTitle ||
    content
      .split(/\n+/)
      .map((segment: string) => segment.trim())
      .filter(Boolean)[0]
      ?.slice(0, 80) ||
    "Captured idea"

  const item = await prisma.item.create({
    data: {
      title: derivedTitle,
      rawInstructions: content,
      status: ItemStatus.INBOX,
      createdByUserId: ownerUserId,
      capturedByUserId: sessionUserId,
      statusHistory: {
        create: {
          toStatus: ItemStatus.INBOX,
          changedById: sessionUserId
        }
      }
    }
  })

  return NextResponse.json(item)
}

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const capturedBy = searchParams.get("capturedBy")

  const whereClause = {
    ...(capturedBy === "me"
      ? { capturedByUserId: session.user.id }
      : { createdByUserId: session.user.id }),
    ...(status && { status: status as ItemStatus })
  }

  const items = await prisma.item.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      capturedBy: {
        select: { email: true }
      }
    }
  })

  console.log(`[GET /api/items] Found ${items.length} items for user ${session.user.id}, status: ${status || "all"}, capturedBy: ${capturedBy || "all"}`)
  if (items.length > 0) {
    console.log(`[GET /api/items] Sample item IDs:`, items.slice(0, 3).map(item => ({ id: item.id, title: item.title, capturedBy: item.capturedBy?.email, createdAt: item.createdAt })))
  }

  return NextResponse.json(items)
}