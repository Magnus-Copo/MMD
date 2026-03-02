
import connectDB from "@/lib/db/mongodb"
import ReportSchedule from "@/lib/db/models/ReportSchedule"
import AuditLog from "@/lib/db/models/AuditLog"
import { AppError, ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { serializeDoc, serializeDocs } from "@/lib/utils/serialize"
import { z } from "zod"
import { ReportScheduleSchema } from "@/lib/validators/common"
import { reportGenerators } from "@/lib/reports/generators"
import { Types } from "mongoose"

export const ToggleReportSchema = z.object({
    scheduleId: z.string().min(1),
    isActive: z.boolean(),
})

export const GenerateReportSchema = z.object({
    type: z.enum(['dailyActivity', 'requirementStatus', 'candidatePipeline', 'timesheet', 'sourceConversion']),
    filters: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        userId: z.string().optional(),
        group: z.string().optional(),
        activityType: z.string().optional(),
        status: z.string().optional(),
        companyId: z.string().optional(),
    }).optional(),
    format: z.enum(['view', 'csv']).default('view'),
})

export type CreateScheduleInput = z.infer<typeof ReportScheduleSchema>
export type ToggleReportInput = z.infer<typeof ToggleReportSchema>
export type GenerateReportInput = z.infer<typeof GenerateReportSchema>

interface UserContext {
    id: string
    role: string
    assignedGroup?: string | null
}

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "RECRUITER"] as const

export class ReportingService {

    /**
     * Create Schedule
     */
    static async createSchedule(user: UserContext, data: CreateScheduleInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const schedule = await ReportSchedule.create({
            ...data,
            createdBy: user.id,
        })

        await AuditLog.create({
            userId: user.id,
            action: "REPORT_SCHEDULE_CREATED",
            entity: "ReportSchedule",
            entityId: schedule._id.toString(),
            newValue: data,
        })

        return serializeDoc(schedule.toObject())
    }

    /**
     * List Schedules
     */
    static async listSchedules(user: UserContext) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()
        const schedules = await ReportSchedule.find().sort({ createdAt: -1 }).lean()
        return serializeDocs(schedules)
    }

    /**
     * Toggle Schedule
     */
    static async toggleSchedule(user: UserContext, data: ToggleReportInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()
        const schedule = await ReportSchedule.findById(data.scheduleId)
        if (!schedule) throw new NotFoundError("Schedule not found")

        schedule.isActive = data.isActive
        await schedule.save()

        await AuditLog.create({
            userId: user.id,
            action: "REPORT_SCHEDULE_TOGGLED",
            entity: "ReportSchedule",
            entityId: schedule._id.toString(),
            newValue: { isActive: schedule.isActive },
        })

        return serializeDoc(schedule.toObject())
    }

    /**
     * Generate Report
     */
    static async generateReport(user: UserContext, data: GenerateReportInput) {
        // No permission check here? Actions had session check but no role check. 
        // Assuming any authenticated user can generate reports?
        // Module 12 didn't check roles. Kept it open.

        const filters = data.filters
            ? {
                ...data.filters,
                from: data.filters.from ? new Date(data.filters.from) : undefined,
                to: data.filters.to ? new Date(data.filters.to) : undefined,
            }
            : {}

        const userContextForGenerator = {
            _id: Types.ObjectId.createFromHexString(user.id),
            role: user.role,
            assignedGroup: user.assignedGroup ?? null,
        }

        let reportData: unknown
        // @ts-ignore
        if (!reportGenerators[data.type]) {
            throw new AppError("Unsupported report type")
        }
        // @ts-ignore
        reportData = await reportGenerators[data.type](filters, userContextForGenerator)

        if (data.format === 'csv') {
            let rows: Record<string, unknown>[] = []
            if (Array.isArray(reportData)) rows = reportData
            else if (reportData && Array.isArray((reportData as any).funnel)) rows = (reportData as any).funnel as Record<string, unknown>[]

            return { csv: ReportingService.toCSV(rows) }
        }

        return reportData
    }

    private static toCSV(rows: Record<string, unknown>[]): string {
        if (!rows.length) return ''
        const headers = Object.keys(rows[0])
        const escape = (v: unknown) => {
            if (v === null || v === undefined) return ''
            const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return '"' + s.replaceAll('"', '""') + '"'
            }
            return s
        }
        const lines = [headers.join(',')]
        for (const row of rows) {
            lines.push(headers.map((h) => escape(row[h])).join(','))
        }
        return lines.join('\n')
    }
}
