import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ItemStatus, ItemType, Priority, Swimlane, AnalysisType } from "@prisma/client"
import { callAIFiler, callAILibrarian } from "@/lib/ai"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { status, type, projectId, routingNotes, title, rawInstructions } = await request.json()

  if (!status && !type && typeof projectId === "undefined" && typeof routingNotes === "undefined" && !title && !rawInstructions) {
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
  }

  if (type) {
    data.type = type as ItemType
  }

  if (typeof projectId !== "undefined") {
    data.projectId = projectId || null
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

  let item = await prisma.item.update({
    where: { id },
    data
  })

  if (status) {
    await prisma.statusChange.create({
      data: {
        itemId: item.id,
        fromStatus: existing.status,
        toStatus: status as ItemStatus,
        changedById: session.user.id
      }
    })
  }

  const projectAssigned = typeof projectId !== "undefined" ? projectId : undefined

  if (projectAssigned) {
    const project = projectAssigned
      ? await prisma.item.findUnique({
          where: { id: projectAssigned },
          select: {
            id: true,
            title: true,
            rawInstructions: true,
            status: true
          }
        })
      : null

    const projectsList = await prisma.item.findMany({
      where: {
        createdByUserId: session.user.id,
        type: ItemType.PROJECT
      },
      select: {
        id: true,
        title: true,
        rawInstructions: true
      }
    })

    const filerInput = {
      Instructions: item.rawInstructions,
      RoutingNotes: item.routingNotes,
      Project: project,
      Projects: projectsList.map((p) => ({ id: p.id, title: p.title })),
      ItemTitle: item.title
    }

    const filerResult = await callAIFiler(filerInput)

    if (filerResult) {
      const statusMap: Record<"To Do" | "On Hold", ItemStatus> = {
        "To Do": ItemStatus.TODO,
        "On Hold": ItemStatus.ON_HOLD
      }

      const swimlaneMap: Record<string, Swimlane | undefined> = {
        Expedite: Swimlane.EXPEDITE,
        Project: Swimlane.PROJECT,
        Habit: Swimlane.HABIT,
        Home: Swimlane.HOME
      }

      const priorityMap: Record<string, Priority | undefined> = {
        High: Priority.HIGH,
        Medium: Priority.MEDIUM,
        Low: Priority.LOW
      }

      const nextStatus = statusMap[filerResult.urgency]
      const nextSwimlane = swimlaneMap[filerResult.swimlane] ?? Swimlane.PROJECT
      const nextPriority = priorityMap[filerResult.priority] ?? Priority.MEDIUM

      const previousStatus = item.status

      item = await prisma.item.update({
        where: { id: item.id },
        data: {
          status: nextStatus,
          swimlane: nextSwimlane,
          priority: nextPriority,
          labels: filerResult.labels,
          statusChangedAt: new Date()
        }
      })

      if (previousStatus !== nextStatus) {
        await prisma.statusChange.create({
          data: {
            itemId: item.id,
            fromStatus: previousStatus,
            toStatus: nextStatus,
            changedById: session.user.id
          }
        })
      }

      // Kick off librarian analysis without blocking response
      const corpus = await prisma.item.findMany({
        where: {
          projectId: item.projectId,
          NOT: { id: item.id }
        },
        select: {
          id: true,
          title: true,
          rawInstructions: true,
          routingNotes: true,
          status: true
        },
        take: 50
      })

      void callAILibrarian({
        New_Item: {
          id: item.id,
          title: item.title,
          raw_instructions: item.rawInstructions,
          routing_notes: item.routingNotes,
          project: project?.title ?? null
        },
        Strategic_Context: project?.rawInstructions ?? "",
        Corpus: corpus
      }).then(async (findings) => {
        if (!findings.length) return

        const typeMap: Record<string, AnalysisType> = {
          Conflict: AnalysisType.CONFLICT,
          Dependency: AnalysisType.DEPENDENCY,
          Redundancy: AnalysisType.REDUNDANCY,
          Relation: AnalysisType.RELATED,
          Suggestion: AnalysisType.SUGGESTION
        }

        const validFindings = findings
          .map((finding) => {
            const mappedType = typeMap[finding.type as keyof typeof typeMap]
            if (!mappedType) return null
            return {
              itemId: item.id,
              analysisType: mappedType,
              analysisText: finding.text
            }
          })
          .filter(Boolean)

        if (!validFindings.length) return

        await prisma.aIAnalysis.createMany({
          data: validFindings as Array<{
            itemId: string
            analysisType: AnalysisType
            analysisText: string
          }>
        })
      }).catch((err) => {
        console.error("AI Librarian scheduling failed:", err)
      })
    }
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
      status: ItemStatus.LIBRARY // Only allow deletion of library items
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