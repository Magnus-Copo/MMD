import { subDays } from "date-fns"
import connectDB from "@/lib/db/mongodb"
import Company from "@/lib/db/models/Company"
import Requirement from "@/lib/db/models/Requirement"
import Activity from "@/lib/db/models/Activity"
import AuditLog from "@/lib/db/models/AuditLog"
import { AppError, ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { RequirementSchema, RequirementStatusSchema } from "@/lib/validators/common"
import { formatMmdId } from "@/lib/utils"
import { RequirementStateMachine, terminalStates } from "@/lib/workflow/state-machine"
import { generateRequirementAutomationAction } from "@/lib/actions/module5-automation" // We might want to move this import or abstract it later if circular deps arise
import { z } from "zod"

// Types
export type RequirementInput = z.infer<typeof RequirementSchema>
export type UpdateRequirementStatusInput = {
    requirementId: string
    status: z.infer<typeof RequirementStatusSchema>
    comment: string
}

const sm = new RequirementStateMachine()
const CREATOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'RECRUITER', 'SCRAPER'] as const
const STALLED_DAYS = Number(process.env.DASHBOARD_STALLED_DAYS ?? 15)

// Helper types
interface UserContext {
    id: string
    role: string
}

export class RequirementService {
    /**
     * Create Requirement
     */
    static async create(user: UserContext, data: RequirementInput) {
        if (!CREATOR_ROLES.includes(user.role as any)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const company = await Company.findById(data.companyId)
        if (!company || company.deletedAt) {
            throw new NotFoundError("Company not found")
        }

        // MOU Contract Enforcement
        if (
            company.mouStatus !== 'SIGNED' ||
            !company.mouEndDate ||
            (company.mouEndDate && company.mouEndDate <= new Date())
        ) {
            throw new AppError("MOU not active for this company. Please upload/approve the MOU and ensure it is not expired before creating a requirement.")
        }

        // Generate MMD ID
        const today = new Date()
        const dateKey = today.toISOString().slice(0, 10).replaceAll('-', '')
        const prefix = `MMD-${data.group}-${dateKey}`
        const count = await Requirement.countDocuments({ mmdId: { $regex: `^${prefix}` } })
        const sequence = count + 1
        const mmdId = formatMmdId(data.group, today, sequence)

        const requirement = await Requirement.create({
            mmdId,
            companyId: data.companyId,
            jobTitle: data.jobTitle,
            fullDescription: data.fullDescription,
            skills: data.skills,
            experienceMin: data.experienceMin,
            experienceMax: data.experienceMax,
            salaryMin: data.salaryMin,
            salaryMax: data.salaryMax,
            openings: data.openings ?? 1,
            workMode: data.workMode,
            location: data.location,
            interviewClosingDate: data.interviewClosingDate,
            group: data.group,
            accountOwnerId: data.accountOwnerId,
            status: data.status ?? 'PENDING_INTAKE', // Explicit default
            applicationFormId: data.applicationFormId,
            whatsAppMessage: data.whatsAppMessage,
            emailMessage: data.emailMessage,
            linkedInPost: data.linkedInPost,
        })

        // Automation Hook (Best Effort)
        try {
            await generateRequirementAutomationAction({ requirementId: requirement._id.toString() })
        } catch (error) {
            console.error('Automation generation failed', error)
        }

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_CREATED",
            entity: "Requirement",
            entityId: requirement._id.toString(),
            newValue: data,
        })

        return requirement.toObject()
    }

    /**
     * Update Requirement Status
     */
    static async updateStatus(user: UserContext, payload: UpdateRequirementStatusInput) {
        await connectDB()

        const requirement = await Requirement.findById(payload.requirementId)
        if (!requirement) throw new NotFoundError("Requirement not found")

        // RBAC: Admin or Owner
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) && requirement.accountOwnerId.toString() !== user.id) {
            throw new ForbiddenError("Forbidden")
        }

        // State Machine Check
        if (!sm.canTransition(requirement.status, payload.status)) {
            const allowedNext = sm.getNextStates(requirement.status)
            throw new AppError(`Invalid transition from ${requirement.status} to ${payload.status}. Allowed: ${allowedNext.join(', ')}`)
        }

        const oldStatus = requirement.status
        requirement.status = payload.status
        await requirement.save()

        await Activity.create({
            requirementId: requirement._id,
            userId: user.id,
            type: 'STATUS_CHANGE',
            comment: payload.comment,
            metadata: { from: oldStatus, to: payload.status },
            nextFollowUpDate: terminalStates.includes(payload.status) ? null : undefined,
        })

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_STATUS_UPDATED",
            entity: "Requirement",
            entityId: requirement._id.toString(),
            oldValue: { status: oldStatus },
            newValue: { status: payload.status },
        })

        return requirement.toObject()
    }

    /**
     * Get All Requirements with Filters & Stalled logic
     */
    static async getAll(user: UserContext, filters?: { status?: string; companyId?: string; group?: string; stalled?: boolean }) {
        if (!CREATOR_ROLES.includes(user.role as any)) { // Reuse creator check as generic read access? Action said "allowRole"
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const query: Record<string, any> = { deletedAt: null }

        // Filters
        if (filters?.status) query.status = filters.status
        if (filters?.companyId) query.companyId = filters.companyId
        if (filters?.group) query.group = filters.group

        // RBAC: Non-admin sees only owned
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
            query.accountOwnerId = user.id
        }

        const requirements = await Requirement.find(query)
            .sort({ createdAt: -1 })
            .lean()

        // Stalled Logic Calculation
        const activeRequirementIds = requirements
            .filter(r => ['ACTIVE', 'SOURCING', 'INTERVIEWING'].includes(r.status))
            .map(r => r._id)

        const activityAgg = await Activity.aggregate([
            { $match: { requirementId: { $in: activeRequirementIds } } },
            { $group: { _id: '$requirementId', lastActivity: { $max: '$createdAt' } } },
        ])

        const lastActivityMap = new Map<string, Date>(
            activityAgg.map((a: any) => [a._id.toString(), a.lastActivity ? new Date(a.lastActivity) : new Date()])
        )

        const stalledCutoff = subDays(new Date(), STALLED_DAYS)

        // Fetch Companies & Users
        const companyIds = [...new Set(requirements.map(r => r.companyId.toString()))]
        const ownerIds = [...new Set(requirements.map(r => r.accountOwnerId.toString()))]

        const [companies, users] = await Promise.all([
            Company.find({ _id: { $in: companyIds } }).lean(),
            connectDB().then(() => import("@/lib/db/models/User").then(m => m.default.find({ _id: { $in: ownerIds } }).lean()))
        ])

        const companyMap = Object.fromEntries(companies.map(c => [c._id.toString(), c]))
        const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]))

        const enriched = requirements.map(req => {
            const lastActivity = lastActivityMap.get(req._id.toString()) ?? req.updatedAt ?? req.createdAt ?? new Date()
            const isStalled =
                ['ACTIVE', 'SOURCING', 'INTERVIEWING'].includes(req.status) &&
                lastActivity <= stalledCutoff

            const company = companyMap[req.companyId.toString()]
            const owner = userMap[req.accountOwnerId.toString()]

            return {
                ...req,
                _id: req._id.toString(),
                companyId: req.companyId.toString(),
                accountOwnerId: req.accountOwnerId.toString(),
                company: company ? company.name : 'Unknown Company',
                owner: owner ? owner.name : 'Unknown Owner',
                companyDetails: company, // Keep object in separate field if needed
                lastActivityAt: lastActivity,
                stalled: isStalled,
            }
        })

        if (filters?.stalled) {
            return enriched.filter(req => req.stalled)
        }

        return enriched
    }

    /**
     * Get By ID
     */
    static async getById(user: UserContext, id: string) {
        if (!CREATOR_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null }).lean()
        if (!requirement) throw new NotFoundError("Requirement not found")

        // RBAC
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) && requirement.accountOwnerId.toString() !== user.id) {
            throw new ForbiddenError("Forbidden")
        }

        const company = await Company.findById(requirement.companyId).lean()
        const activities = await Activity.find({ requirementId: requirement._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()

        return {
            ...requirement,
            _id: requirement._id.toString(),
            companyId: requirement.companyId.toString(),
            accountOwnerId: requirement.accountOwnerId.toString(),
            company: company ? { ...company, _id: company._id.toString() } : null,
            activities: activities.map(a => ({
                ...a,
                _id: a._id.toString(),
                requirementId: a.requirementId.toString(),
                userId: a.userId?.toString()
            })),
        }
    }

    /**
     * Update Requirement (Fields)
     */
    static async update(user: UserContext, id: string, data: any) {
        if (!CREATOR_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null })
        if (!requirement) throw new NotFoundError("Requirement not found")

        // RBAC
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) && requirement.accountOwnerId.toString() !== user.id) {
            throw new ForbiddenError("Forbidden")
        }

        const oldValue = requirement.toObject()

        // Apply Updates
        const fieldsToUpdate = [
            'jobTitle', 'fullDescription', 'skills', 'workMode', 'location', 'group', 'accountOwnerId'
        ]
        fieldsToUpdate.forEach(field => {
            if (data[field]) (requirement as any)[field] = data[field]
        })

        if (data.experienceMin !== undefined) requirement.experienceMin = data.experienceMin
        if (data.experienceMax !== undefined) requirement.experienceMax = data.experienceMax
        if (data.salaryMin !== undefined) requirement.salaryMin = data.salaryMin
        if (data.salaryMax !== undefined) requirement.salaryMax = data.salaryMax
        if (data.openings !== undefined) requirement.openings = data.openings
        if (data.interviewClosingDate !== undefined) requirement.interviewClosingDate = data.interviewClosingDate

        await requirement.save()

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_UPDATED",
            entity: "Requirement",
            entityId: requirement._id.toString(),
            oldValue,
            newValue: requirement.toObject(),
        })

        return requirement.toObject()
    }

    /**
     * Freeze Requirement
     */
    static async freeze(user: UserContext, id: string, comment?: string) {
        if (!['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(user.role)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null })
        if (!requirement) throw new NotFoundError("Requirement not found")

        if (terminalStates.includes(requirement.status)) {
            throw new AppError("Cannot freeze a closed requirement")
        }

        requirement.status = 'ON_HOLD'
        await requirement.save()

        await Activity.create({
            requirementId: requirement._id,
            userId: user.id,
            type: 'STATUS_CHANGE',
            summary: `Requirement frozen` + (comment ? `: ${comment}` : ''),
            outcome: 'PENDING',
            nextFollowUpDate: null, // Should null be passed? Mongoose handles explicit null
        })

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_FROZEN",
            entity: "Requirement",
            entityId: requirement._id.toString(),
            newValue: { status: 'ON_HOLD', comment },
        })

        return requirement.toObject()
    }

    /**
     * Reassign Requirement
     */
    static async reassign(user: UserContext, id: string, newOwnerId: string, comment?: string) {
        if (!['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(user.role)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null })
        if (!requirement) throw new NotFoundError("Requirement not found")

        const oldOwner = requirement.accountOwnerId?.toString()
        requirement.accountOwnerId = newOwnerId as any
        await requirement.save()

        await Activity.create({
            requirementId: requirement._id,
            userId: user.id,
            type: 'STATUS_CHANGE',
            summary: `Requirement reassigned to ${newOwnerId}` + (comment ? `: ${comment}` : ''),
            outcome: 'PENDING',
            metadata: { fromOwner: oldOwner, toOwner: newOwnerId },
        })

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_REASSIGNED",
            entity: "Requirement",
            entityId: requirement._id.toString(),
            oldValue: { accountOwnerId: oldOwner },
            newValue: { accountOwnerId: newOwnerId, comment },
        })

        return requirement.toObject()
    }

    /**
     * Archive Requirement
     */
    static async delete(user: UserContext, id: string) {
        if (!['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(user.role)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const requirement = await Requirement.findById(id)
        if (!requirement) throw new NotFoundError("Requirement not found")
        if (requirement.deletedAt) throw new AppError("Requirement is already archived")

        requirement.deletedAt = new Date()
        await requirement.save()

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_ARCHIVED",
            entity: "Requirement",
            entityId: id,
            oldValue: { deletedAt: null },
            newValue: { deletedAt: requirement.deletedAt },
        })

        return { success: true }
    }

    /**
     * Restore Requirement
     */
    static async restore(user: UserContext, id: string) {
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) throw new ForbiddenError("Forbidden")

        await connectDB()

        const requirement = await Requirement.findById(id)
        if (!requirement) throw new NotFoundError("Requirement not found")
        if (!requirement.deletedAt) throw new AppError("Requirement is not archived")

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        if (requirement.deletedAt < thirtyDaysAgo) {
            throw new AppError("Restore window expired (30 days)")
        }

        const oldDeletedAt = requirement.deletedAt
        requirement.deletedAt = null
        await requirement.save()

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_RESTORED",
            entity: "Requirement",
            entityId: id,
            oldValue: { deletedAt: oldDeletedAt },
            newValue: { deletedAt: null },
        })

        return { success: true }
    }
}
