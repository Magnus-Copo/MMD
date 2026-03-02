"use server"

import { createProtectedAction } from "@/lib/core/action-client"
import {
  CommunicationService,
  CloseThreadSchema,
  ListMessagesSchema
} from "@/lib/services/communication.service"
import { CommunicationThreadSchema, CommunicationMessageSchema } from "@/lib/validators/common"

export const createThreadAction = createProtectedAction(
  CommunicationThreadSchema,
  async (payload, session) => {
    const thread = await CommunicationService.createThread(
      { id: session.user.id, role: session.user.role },
      { ...payload, participantIds: payload.participantIds ?? [] }
    )
    return thread
  }
)

export const postMessageAction = createProtectedAction(
  CommunicationMessageSchema,
  async (payload, session) => {
    const message = await CommunicationService.postMessage(
      { id: session.user.id, role: session.user.role },
      payload
    )
    return message
  }
)

export const closeThreadAction = createProtectedAction(
  CloseThreadSchema,
  async (payload, session) => {
    const thread = await CommunicationService.closeThread(
      { id: session.user.id, role: session.user.role },
      payload.threadId
    )
    return thread
  }
)

export const listThreadMessagesAction = createProtectedAction(
  ListMessagesSchema,
  async (payload, session) => {
    const data = await CommunicationService.getThreadWithMessages(
      { id: session.user.id, role: session.user.role },
      payload.threadId
    )
    return data
  }
)

