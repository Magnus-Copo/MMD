
import connectDB from "@/lib/db/mongodb"
import ExportJob from "@/lib/db/models/ExportJob"
import AuditLog from "@/lib/db/models/AuditLog"
import { ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { serializeDoc } from "@/lib/utils/serialize"
import { z } from "zod"
import { ExportJobSchema, ExportStatusSchema } from "@/lib/validators/common"

export const CompleteExportJobSchema = z.object({
    jobId: z.string().min(1),
    status: ExportStatusSchema.optional(),
    fileUrl: z.string().url().optional(),
    errorMessage: z.string().optional(),
})

export type CreateExportJobInput = z.infer<typeof ExportJobSchema>
export type CompleteExportJobInput = z.infer<typeof CompleteExportJobSchema>

interface UserContext {
    id: string
    role: string
}

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "RECRUITER"] as const

export class ExportService {
    /**
     * Create Export Job
     */
    static async createJob(user: UserContext, data: CreateExportJobInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const job = await ExportJob.create({
            entityType: data.entityType,
            format: data.format,
            status: 'PENDING',
            requestedBy: user.id,
            filter: data.filter,
            startedAt: null,
            completedAt: null,
        })

        await AuditLog.create({
            userId: user.id,
            action: "EXPORT_JOB_CREATED",
            entity: "ExportJob",
            entityId: job._id.toString(),
            newValue: data,
        })

        return serializeDoc(job.toObject())
    }

    /**
     * Complete Export Job (System Action usually or Polling update)
     */
    static async markComplete(user: UserContext, data: CompleteExportJobInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const job = await ExportJob.findById(data.jobId)
        if (!job) throw new NotFoundError("Export job not found")

        job.status = data.status ?? 'COMPLETED'
        job.fileUrl = data.fileUrl ?? job.fileUrl
        job.errorMessage = data.errorMessage
        job.completedAt = new Date()
        job.startedAt ??= new Date()

        await job.save()

        await AuditLog.create({
            userId: user.id,
            action: "EXPORT_JOB_COMPLETED",
            entity: "ExportJob",
            entityId: job._id.toString(),
            newValue: { status: job.status, fileUrl: job.fileUrl, errorMessage: job.errorMessage },
        })

        return serializeDoc(job.toObject())
    }
}
