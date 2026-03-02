"use server"

import { z } from "zod"
import connectDB from "@/lib/db/mongodb"
import Requirement from "@/lib/db/models/Requirement"
import Activity from "@/lib/db/models/Activity"
import AuditLog from "@/lib/db/models/AuditLog"
import Company from "@/lib/db/models/Company"
import { RequirementStatusSchema } from "@/lib/validators/common"
import { auth } from "@/lib/auth"
import { RequirementStateMachine, terminalStates } from "@/lib/workflow/state-machine"

const UpdateStatusSchema = z.object({
  requirementId: z.string().min(1),
  status: RequirementStatusSchema,
  comment: z.string().min(5, "Comment is required"),
  nextFollowUpDate: z.date().optional(),
})

const sm = new RequirementStateMachine()

export async function updateRequirementStatusAction(payload: z.infer<typeof UpdateStatusSchema>) {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const parsed = UpdateStatusSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  await connectDB()

  const requirement = await Requirement.findById(parsed.data.requirementId)
  if (!requirement) return { success: false, error: "Requirement not found" }

  const company = await Company.findById(requirement.companyId)
  if (parsed.data.status === 'ACTIVE' && company && company.mouStatus !== 'SIGNED') {
    return { success: false, error: "Company MOU must be SIGNED before activating a requirement" }
  }

  const isOwner = requirement.accountOwnerId.toString() === session.user.id
  if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) && !isOwner) {
    return { success: false, error: "Forbidden" }
  }

  const from = requirement.status
  const to = parsed.data.status

  if (!sm.canTransition(from, to)) {
    const allowed = sm.getNextStates(from)
    return { success: false, error: `Invalid transition. Allowed: ${allowed.join(', ')}` }
  }

  if (!terminalStates.includes(to) && parsed.data.nextFollowUpDate && parsed.data.nextFollowUpDate < new Date()) {
    return { success: false, error: "Follow-up date cannot be in the past" }
  }

  if (terminalStates.includes(to) && parsed.data.nextFollowUpDate) {
    return { success: false, error: "Cannot set follow-up for terminal status" }
  }

  requirement.status = to
  await requirement.save()

  const activity = await Activity.create({
    requirementId: requirement._id!,
    userId: session.user.id as any,
    type: 'STATUS_CHANGE',
    summary: parsed.data.comment,
    outcome: 'PENDING',
    nextFollowUpDate: parsed.data.nextFollowUpDate ?? null,
    isCompleted: terminalStates.includes(to),
    metadata: { from, to },
  })

  await AuditLog.create({
    userId: session.user.id,
    action: "REQUIREMENT_STATUS_UPDATED",
    entity: "Requirement",
    entityId: requirement._id!.toString(),
    oldValue: { status: from },
    newValue: { status: to },
  })

  return { success: true, data: { requirement, activity } }
}
