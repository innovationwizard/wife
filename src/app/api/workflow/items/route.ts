import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ItemStatus } from "@prisma/client"

const WORKFLOW_STATUSES = [
  ItemStatus.TODO,
  ItemStatus.ON_HOLD,
  ItemStatus.CREATE,
  ItemStatus.IN_REVIEW,
  ItemStatus.BLOCKED,
  ItemStatus.DONE
]

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const items = await prisma.item.findMany({
    where: {
      createdByUserId: session.user.id,
      status: {
        in: WORKFLOW_STATUSES
      }
    },
    include: {
      createdBy: {
        select: {
          email: true
        }
      }
    },
    orderBy: [
      { priority: 'asc' },
      { statusChangedAt: 'asc' }
    ]
  })

  return NextResponse.json(items)
}