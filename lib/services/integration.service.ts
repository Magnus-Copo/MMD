
import connectDB from "@/lib/db/mongodb"
import IntegrationConfig from "@/lib/db/models/IntegrationConfig"
import AuditLog from "@/lib/db/models/AuditLog"
import { ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { serializeDoc, serializeDocs } from "@/lib/utils/serialize"
import { z } from "zod"
import { IntegrationConfigSchema } from "@/lib/validators/common"

export const UpsertIntegrationSchema = IntegrationConfigSchema.extend({ id: z.string().optional() })
export const ToggleIntegrationSchema = z.object({
    id: z.string().min(1),
    isActive: z.boolean(),
})

export type UpsertIntegrationInput = z.infer<typeof UpsertIntegrationSchema>
export type ToggleIntegrationInput = z.infer<typeof ToggleIntegrationSchema>

interface UserContext {
    id: string
    role: string
}

export class IntegrationService {
    /**
     * Upsert Integration
     */
    static async upsert(user: UserContext, data: UpsertIntegrationInput) {
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) throw new ForbiddenError("Forbidden")

        await connectDB()

        if (data.id) {
            const existing = await IntegrationConfig.findById(data.id)
            if (!existing) throw new NotFoundError("Integration not found")

            const oldValue = existing.toObject()
            existing.name = data.name
            existing.provider = data.provider
            existing.isActive = data.isActive
            existing.config = data.config
            await existing.save()

            await AuditLog.create({
                userId: user.id,
                action: "INTEGRATION_UPDATED",
                entity: "IntegrationConfig",
                entityId: existing._id.toString(),
                oldValue,
                newValue: { name: data.name, provider: data.provider },
            })

            return serializeDoc(existing.toObject())
        }

        const created = await IntegrationConfig.create({
            name: data.name,
            provider: data.provider,
            isActive: data.isActive,
            config: data.config,
            createdBy: user.id,
        })

        await AuditLog.create({
            userId: user.id,
            action: "INTEGRATION_CREATED",
            entity: "IntegrationConfig",
            entityId: created._id.toString(),
            newValue: { name: data.name, provider: data.provider },
        })

        return serializeDoc(created.toObject())
    }

    /**
     * Toggle Integration
     */
    static async toggle(user: UserContext, data: ToggleIntegrationInput) {
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) throw new ForbiddenError("Forbidden")

        await connectDB()
        const integration = await IntegrationConfig.findById(data.id)
        if (!integration) throw new NotFoundError("Integration not found")

        integration.isActive = data.isActive
        await integration.save()

        await AuditLog.create({
            userId: user.id,
            action: "INTEGRATION_TOGGLED",
            entity: "IntegrationConfig",
            entityId: integration._id.toString(),
            newValue: { isActive: integration.isActive },
        })

        return serializeDoc(integration.toObject())
    }

    /**
     * List Integrations
     */
    static async list(user: UserContext, provider?: string) {
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) throw new ForbiddenError("Forbidden")

        await connectDB()
        const query = provider ? { provider } : {}
        const configs = await IntegrationConfig.find(query).sort({ createdAt: -1 }).lean()
        return serializeDocs(configs)
    }
}
