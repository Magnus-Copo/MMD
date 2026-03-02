
import connectDB from "@/lib/db/mongodb"
import Candidate, { CandidateStatus } from "@/lib/db/models/Candidate"
import Requirement, { RequirementStatus } from "@/lib/db/models/Requirement"
import Company from "@/lib/db/models/Company"
import AuditLog from "@/lib/db/models/AuditLog"
import mongoose from "mongoose"
import { AppError, ForbiddenError, NotFoundError, ConflictError } from "@/lib/core/app-error"
import { serializeDocs } from "@/lib/utils/serialize"
import { terminalStates } from "@/lib/workflow/state-machine"
import { z } from "zod"

// Zod Schemas for Input Validation
export const CandidateSchema = z.object({
    requirementId: z.string().min(1),
    applicationFormId: z.string().optional(),
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    resumeUrl: z.string().url().optional(),
    skills: z.array(z.string().min(1)).default([]),
    college: z.string().optional(),
    yearsExperience: z.number().nonnegative().optional(),
})

export const UpdateCandidateStatusSchema = z.object({
    candidateId: z.string().min(1),
    status: z.enum(['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'JOINED', 'REJECTED']),
    // Optional payloads used for validation when transitioning
    phoneLog: z.string().optional(),
    interview: z.object({ datetime: z.string().min(1), interviewerEmail: z.string().email() }).optional(),
    rejectionReasonCode: z.string().optional(),
    offeredCtc: z.number().nonnegative().optional(),
})

export const UpdateCandidateProfileSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(2).optional(),
    phone: z.string().min(8).optional(),
    email: z.string().email().optional(),
    resumeUrl: z.string().url().optional(),
    skills: z.array(z.string().min(1)).optional(),
    college: z.string().optional(),
    yearsExperience: z.number().nonnegative().optional(),
})

// Types
export type CreateCandidateInput = z.infer<typeof CandidateSchema>
export type UpdateCandidateStatusInput = z.infer<typeof UpdateCandidateStatusSchema>
export type UpdateCandidateProfileInput = z.infer<typeof UpdateCandidateProfileSchema>

interface UserContext {
    id: string
    role: string
}

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'RECRUITER'] as const

export class CandidateService {
    /**
     * Create Candidate
     */
    static async create(user: UserContext, data: CreateCandidateInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const requirement = await Requirement.findById(data.requirementId)
        if (!requirement) throw new NotFoundError("Requirement not found")

        if (terminalStates.includes(requirement.status as RequirementStatus)) {
            throw new AppError("Requirement is closed")
        }

        // Duplicate Check (Email + Requirement)
        const existing = await Candidate.findOne({
            email: data.email.toLowerCase(),
            requirementId: data.requirementId,
            deletedAt: null
        })

        if (existing) {
            throw new ConflictError("Candidate already exists for this requirement")
        }

        const candidate = await Candidate.create({
            ...data,
            email: data.email.toLowerCase(),
        })

        await AuditLog.create({
            userId: user.id,
            action: "CANDIDATE_CREATED",
            entity: "Candidate",
            entityId: candidate._id.toString(),
            newValue: { requirementId: requirement._id.toString(), email: candidate.email },
        })

        return candidate.toObject()
    }

    /**
     * Update Candidate Status
     */
    static async updateStatus(user: UserContext, payload: UpdateCandidateStatusInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const candidate = await Candidate.findById(payload.candidateId)
        if (!candidate) throw new NotFoundError("Candidate not found")

        const requirement = await Requirement.findById(candidate.requirementId)
        if (!requirement) throw new NotFoundError("Requirement not found")

        const to = payload.status
        const now = new Date()
        let warning: string | undefined

        // State Machine & Validations
        if (to === 'SHORTLISTED') {
            if (!payload.phoneLog) throw new AppError("Phone log is required to shortlist")
            candidate.shortlistedAt = now
        }

        if (to === 'INTERVIEWED') {
            const interview = payload.interview
            if (!interview?.datetime || !interview?.interviewerEmail) {
                throw new AppError("Interview datetime and interviewer email are required")
            }
            candidate.interviewedAt = now
        }

        if (to === 'OFFERED') {
            if (payload.offeredCtc === undefined) {
                throw new AppError("Offered CTC is required")
            }
            candidate.offeredAt = now

            if (requirement.salaryMax && payload.offeredCtc > requirement.salaryMax) {
                warning = 'Offered CTC exceeds requirement budget (margin warning)'
            }

            if (requirement.status === 'INTERVIEWING' || requirement.status === 'SOURCING') {
                requirement.status = 'OFFER'
            }
        }

        if (to === 'JOINED') {
            candidate.joinedAt = now
            requirement.status = 'CLOSED_HIRED'
        }

        if (to === 'REJECTED') {
            if (!payload.rejectionReasonCode) {
                throw new AppError("Rejection reason code is required")
            }
            candidate.rejectedAt = now
        }

        candidate.status = to as CandidateStatus
        await candidate.save()
        await requirement.save()

        await AuditLog.create({
            userId: user.id,
            action: "CANDIDATE_STATUS_UPDATED",
            entity: "Candidate",
            entityId: candidate._id.toString(),
            newValue: { status: to },
        })

        // Trigger Invoice Logic (Lazy Upload)
        if (to === 'JOINED') {
            import('@/lib/actions/module14-invoice').then((mod) => {
                mod.createInvoice({
                    companyId: requirement.companyId.toString(),
                    requirementId: requirement._id.toString(),
                    amount: payload.offeredCtc ?? 0,
                    currency: 'INR',
                }).catch((err) => console.error("Invoice creation failed", err))
            }).catch((err) => console.error("Invoice module import failed", err))
        }

        return { candidate: candidate.toObject(), warning }
    }

    /**
     * Get All Candidates (with Filter)
     */
    static async getAll(user: UserContext, filters?: { requirementId?: string; status?: string }) {
        if (!ALLOWED_ROLES.includes(user.role as any)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const query: Record<string, any> = { deletedAt: null }
        if (filters?.requirementId) query.requirementId = filters.requirementId
        if (filters?.status) query.status = filters.status

        const candidates = await Candidate.find(query).sort({ createdAt: -1 }).lean()

        // Populate Requirement & Company
        const requirementIds = [...new Set(candidates.map(c => c.requirementId.toString()))]
        const requirements = await Requirement.find({ _id: { $in: requirementIds } }).lean()
        const requirementMap = Object.fromEntries(requirements.map(r => [r._id.toString(), r]))

        const companyIds = [...new Set(requirements.map(r => r.companyId.toString()))]
        const companies = await Company.find({ _id: { $in: companyIds } }).lean()
        const companyMap = Object.fromEntries(companies.map(c => [c._id.toString(), c]))

        return candidates.map(candidate => {
            const req = requirementMap[candidate.requirementId.toString()]
            const company = req ? companyMap[req.companyId.toString()] : null

            return {
                ...candidate,
                _id: candidate._id.toString(),
                requirementId: candidate.requirementId.toString(),
                requirement: req ? {
                    ...req,
                    _id: req._id.toString(),
                    companyId: req.companyId.toString(),
                    company: company ? company.name : 'Unknown Company',
                    companyDetails: company
                } : null
            }
        })
    }

    /**
     * Get Candidate By ID
     */
    static async getById(user: UserContext, id: string) {
        if (!ALLOWED_ROLES.includes(user.role as any)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const candidate = await Candidate.findOne({ _id: id, deletedAt: null }).lean()
        if (!candidate) throw new NotFoundError("Candidate not found")

        const requirement = await Requirement.findById(candidate.requirementId).lean()
        const company = requirement ? await Company.findById(requirement.companyId).lean() : null

        return {
            ...candidate,
            _id: candidate._id.toString(),
            requirementId: candidate.requirementId.toString(),
            requirement: requirement ? {
                ...requirement,
                _id: requirement._id.toString(),
                companyId: requirement.companyId.toString(),
                company: company ? company.name : 'Unknown Company',
                companyDetails: company
            } : null
        }
    }

    /**
     * Update Candidate Profile
     */
    static async update(user: UserContext, payload: UpdateCandidateProfileInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const candidate = await Candidate.findOne({ _id: payload.id, deletedAt: null })
        if (!candidate) throw new NotFoundError("Candidate not found")

        const oldValue = candidate.toObject()

        if (payload.name !== undefined) candidate.name = payload.name
        if (payload.phone !== undefined) candidate.phone = payload.phone
        if (payload.email !== undefined) candidate.email = payload.email.toLowerCase()
        if (payload.resumeUrl !== undefined) candidate.resumeUrl = payload.resumeUrl
        if (payload.skills !== undefined) candidate.skills = payload.skills
        if (payload.college !== undefined) candidate.college = payload.college
        if (payload.yearsExperience !== undefined) candidate.yearsExperience = payload.yearsExperience

        await candidate.save()

        await AuditLog.create({
            userId: user.id,
            action: "CANDIDATE_UPDATED",
            entity: "Candidate",
            entityId: candidate._id.toString(),
            oldValue,
            newValue: candidate.toObject(),
        })

        return candidate.toObject()
    }

    /**
     * Delete Candidate (Soft Delete)
     */
    static async delete(user: UserContext, id: string) {
        if (!ALLOWED_ROLES.includes(user.role as any)) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const candidate = await Candidate.findOne({ _id: id, deletedAt: null })
        if (!candidate) throw new NotFoundError("Candidate not found")

        candidate.deletedAt = new Date()
        await candidate.save()

        await AuditLog.create({
            userId: user.id,
            action: "CANDIDATE_DELETED",
            entity: "Candidate",
            entityId: candidate._id.toString(),
            oldValue: { name: candidate.name, email: candidate.email },
        })

        return { success: true }
    }

    /**
     * Restore Candidate
     */
    static async restore(user: UserContext, id: string) {
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) throw new ForbiddenError("Forbidden")

        await connectDB()

        const candidate = await Candidate.findById(id)
        if (!candidate) throw new NotFoundError("Candidate not found")
        if (!candidate.deletedAt) throw new AppError("Candidate is not archived")

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        if (candidate.deletedAt < thirtyDaysAgo) {
            throw new AppError("Restore window expired (30 days)")
        }

        const oldDeletedAt = candidate.deletedAt
        candidate.deletedAt = null
        await candidate.save()

        await AuditLog.create({
            userId: user.id,
            action: "CANDIDATE_RESTORED",
            entity: "Candidate",
            entityId: id,
            oldValue: { deletedAt: oldDeletedAt },
            newValue: { deletedAt: null },
        })

        return { success: true }
    }

    /**
     * Get Pipeline Metrics
     */
    static async getPipeline(user: UserContext, requirementId: string) {
        if (!user.id) throw new ForbiddenError("Unauthorized")

        await connectDB()

        const pipeline = await Candidate.aggregate([
            { $match: { requirementId: new mongoose.Types.ObjectId(requirementId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])

        const candidates = await Candidate.find({ requirementId }).sort({ createdAt: -1 })

        return {
            pipeline,
            candidates: serializeDocs(candidates)
        }
    }
}
