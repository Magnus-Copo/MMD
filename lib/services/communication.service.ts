
import connectDB from "@/lib/db/mongodb"
import CommunicationThread from "@/lib/db/models/CommunicationThread"
import CommunicationMessage from "@/lib/db/models/CommunicationMessage"
import AuditLog from "@/lib/db/models/AuditLog"
import { AppError, ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { serializeDoc, serializeDocs } from "@/lib/utils/serialize"
import { z } from "zod"
import { CommunicationMessageSchema, CommunicationThreadSchema } from "@/lib/validators/common"

export const CloseThreadSchema = z.object({ threadId: z.string().min(1) })
export const ListMessagesSchema = z.object({ threadId: z.string().min(1) })

export type CreateThreadInput = z.infer<typeof CommunicationThreadSchema>
export type PostMessageInput = z.infer<typeof CommunicationMessageSchema>

interface UserContext {
    id: string
    role: string
}

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "RECRUITER"] as const

export class CommunicationService {

    /**
     * Create Thread
     */
    static async createThread(user: UserContext, data: CreateThreadInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const thread = await CommunicationThread.create({
            entityType: data.entityType,
            entityId: data.entityId,
            subject: data.subject,
            createdBy: user.id,
            participants: [user.id, ...(data.participantIds || [])],
        })

        await AuditLog.create({
            userId: user.id,
            action: "COMM_THREAD_CREATED",
            entity: data.entityType,
            entityId: data.entityId,
            newValue: { threadId: thread._id.toString(), subject: thread.subject },
        })

        return serializeDoc(thread.toObject())
    }

    /**
     * Post Message
     */
    static async postMessage(user: UserContext, data: PostMessageInput) {
        await connectDB()

        const thread = await CommunicationThread.findById(data.threadId)
        if (!thread) throw new NotFoundError("Thread not found")
        if (thread.isClosed) throw new AppError("Thread is closed")

        // Ensure user is participant or can view? 
        // Original logic: just checked session.user. 
        // But we should probably add user to participants if not already there.
        // Original logic: if (!thread.participants?.includes(user.id)) thread.participants.push(user.id)

        const message = await CommunicationMessage.create({
            threadId: thread._id,
            senderId: user.id,
            channel: data.channel,
            direction: data.direction,
            body: data.body,
            metadata: data.metadata,
        })

        thread.lastMessageAt = new Date()
        const participants = thread.participants?.map(p => p.toString()) || []
        if (!participants.includes(user.id)) {
            thread.participants = [...(thread.participants || []), user.id as any]
        }
        await thread.save()

        await AuditLog.create({
            userId: user.id,
            action: "COMM_MESSAGE_POSTED",
            entity: "CommunicationThread",
            entityId: thread._id.toString(),
            newValue: { messageId: message._id.toString(), channel: message.channel },
        })

        return serializeDoc(message.toObject())
    }

    /**
     * Close Thread
     */
    static async closeThread(user: UserContext, threadId: string) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()
        const thread = await CommunicationThread.findById(threadId)
        if (!thread) throw new NotFoundError("Thread not found")

        thread.isClosed = true
        await thread.save()

        await AuditLog.create({
            userId: user.id,
            action: "COMM_THREAD_CLOSED",
            entity: "CommunicationThread",
            entityId: thread._id.toString(),
            newValue: { isClosed: true }
        })

        return serializeDoc(thread.toObject())
    }

    /**
     * Get Thread with Messages
     */
    static async getThreadWithMessages(user: UserContext, threadId: string) {
        await connectDB()
        const thread = await CommunicationThread.findById(threadId).lean()
        if (!thread) throw new NotFoundError("Thread not found")

        // Authorization check? Original logic was just session check. 
        // Assuming if you have the ID you can view, or relying on higher level permission catch.
        // But strictly, maybe enforce "can view entity"? 
        // For now, mirroring existing logic which didn't strictly check entity ownership, just auth.

        const messages = await CommunicationMessage.find({ threadId }).sort({ createdAt: -1 }).lean()

        return {
            thread: serializeDoc(thread),
            messages: serializeDocs(messages)
        }
    }
}
