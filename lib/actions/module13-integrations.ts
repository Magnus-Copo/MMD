"use server"

import { createProtectedAction } from "@/lib/core/action-client"
import {
  IntegrationService,
  UpsertIntegrationSchema,
  ToggleIntegrationSchema
} from "@/lib/services/integration.service"
import { IntegrationProviderSchema } from "@/lib/validators/common"


export const upsertIntegrationConfigAction = createProtectedAction(
  UpsertIntegrationSchema,
  async (payload, session) => {
    const integration = await IntegrationService.upsert(
      { id: session.user.id, role: session.user.role },
      { ...payload, isActive: payload.isActive ?? false }
    )
    return integration
  }
)

export const toggleIntegrationConfigAction = createProtectedAction(
  ToggleIntegrationSchema,
  async (payload, session) => {
    const integration = await IntegrationService.toggle(
      { id: session.user.id, role: session.user.role },
      payload
    )
    return integration
  }
)

export const listIntegrationConfigsAction = createProtectedAction(
  IntegrationProviderSchema.optional(),
  async (payload, session) => {
    const configs = await IntegrationService.list(
      { id: session.user.id, role: session.user.role },
      payload
    )
    return configs
  }
)

