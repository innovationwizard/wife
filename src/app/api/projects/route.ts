import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ItemStatus, ItemType, Priority, Swimlane } from "@prisma/client"

function requireCreator(session: Awaited<ReturnType<typeof auth>>) {
  if (!session?.user?.id || session.user.role !== "CREATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET() {
  const session = await auth()
  const forbidden = requireCreator(session)
  if (forbidden) return forbidden

  const projects = await prisma.item.findMany({
    where: {
      createdByUserId: session!.user!.id,
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
  const session = await auth()
  const forbidden = requireCreator(session)
  if (forbidden) return forbidden

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
      createdByUserId: session!.user!.id,
      capturedByUserId: session!.user!.id,
      statusHistory: {
        create: {
          toStatus: ItemStatus.TODO,
          changedById: session!.user!.id
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

