import { NextRequest, NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ItemStatus, ItemType, Priority, Swimlane } from "@prisma/client"

type SessionWithRole = Session & {
  user: {
    id: string
    role?: string | null
  }
}

function isCreator(session: SessionWithRole | null): session is SessionWithRole {
  return Boolean(session?.user?.id && session.user.role === "CREATOR")
}

export async function GET() {
  const session = (await auth()) as SessionWithRole | null
  if (!isCreator(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const projects = await prisma.item.findMany({
    where: {
      createdByUserId: session.user.id,
      type: ItemType.PROJECT
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true
    }
  })

  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const session = (await auth()) as SessionWithRole | null
  if (!isCreator(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { title } = await request.json()

  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    )
  }

  const trimmed = title.trim()
  if (!trimmed) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    )
  }

  const project = await prisma.item.create({
    data: {
      title: trimmed,
      rawInstructions: "",
      type: ItemType.PROJECT,
      status: ItemStatus.TODO,
      priority: Priority.MEDIUM,
      swimlane: Swimlane.PROJECT,
      createdByUserId: session.user.id,
      capturedByUserId: session.user.id,
      statusHistory: {
        create: {
          toStatus: ItemStatus.TODO,
          changedById: session.user.id
        }
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true
    }
  })

  return NextResponse.json(project)
}

