"use server"

import { createProtectedAction } from "@/lib/core/action-client"
import {
  ExportService,
  CompleteExportJobSchema
} from "@/lib/services/export.service"
import { ExportJobSchema } from "@/lib/validators/common"



export const createExportJobAction = createProtectedAction(
  ExportJobSchema,
  async (payload, session) => {
    const job = await ExportService.createJob(
      { id: session.user.id, role: session.user.role },
      payload
    )
    return job
  }
)

export const markExportJobCompleteAction = createProtectedAction(
  CompleteExportJobSchema,
  async (payload, session) => {
    const job = await ExportService.markComplete(
      { id: session.user.id, role: session.user.role },
      payload
    )
    return job
  }
)

