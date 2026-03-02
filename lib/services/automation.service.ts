
import connectDB from "@/lib/db/mongodb"
import Requirement from "@/lib/db/models/Requirement"
import ApplicationForm from "@/lib/db/models/ApplicationForm"
import Candidate from "@/lib/db/models/Candidate"
import Company from "@/lib/db/models/Company"
import AuditLog from "@/lib/db/models/AuditLog"
import { AppError, ForbiddenError, NotFoundError, ConflictError } from "@/lib/core/app-error"
import { z } from "zod"
import {
    applyGeneratedContent,
    generateApplicationForm,
    generateHiringContent,
    regenerateSingleContent,
} from "@/lib/automation/content-generator"
import { templates } from "@/lib/templates/hiring-messages"

// Schemas
export const GenerateAutomationSchema = z.object({
    requirementId: z.string().min(1),
})

export const RegenerateContentSchema = z.object({
    requirementId: z.string().min(1),
    type: z.enum(["whatsapp", "email", "linkedIn"] as const),
})

export const GetFormSchema = z.object({ slug: z.string().min(1) })

export const SubmitApplicationSchema = z.object({
    slug: z.string().min(1),
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    resumeUrl: z.string().url().optional(),
    skills: z.array(z.string().min(1)).default([]),
    college: z.string().optional(),
    yearsExperience: z.number().nonnegative().optional(),
})

// Types
export type GenerateAutomationInput = z.infer<typeof GenerateAutomationSchema>
export type RegenerateContentInput = z.infer<typeof RegenerateContentSchema>
export type SubmitApplicationInput = z.infer<typeof SubmitApplicationSchema>

interface UserContext {
    id: string
    role: string
}

export class AutomationService {

    private static absoluteUrl(path: string) {
        const base = process.env.NEXT_PUBLIC_APP_URL || ""
        return `${base}${path}`
    }

    private static ensureRole(user: UserContext, ownerId: string) {
        if ((['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) || user.role === "COORDINATOR" || user.role === "RECRUITER") return true
        return ownerId === user.id
    }

    /**
     * Generate Automation (Content + Form)
     */
    static async generateAutomation(user: UserContext, data: GenerateAutomationInput) {
        await connectDB()

        const requirement = await Requirement.findById(data.requirementId)
        if (!requirement) throw new NotFoundError("Requirement not found")

        if (['CLOSED_HIRED', 'CLOSED_NOT_HIRED', 'ON_HOLD'].includes(requirement.status)) {
            throw new AppError("Cannot generate automation for closed/on-hold requirement")
        }

        if (!this.ensureRole(user, requirement.accountOwnerId.toString())) {
            throw new ForbiddenError("Forbidden")
        }

        const { appForm, shareableUrl } = await generateApplicationForm(requirement as any)
        const formUrl = this.absoluteUrl(shareableUrl)
        const content = await generateHiringContent(requirement as any, formUrl)
        await applyGeneratedContent(data.requirementId, content)

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_AUTOMATION_GENERATED",
            entity: "Requirement",
            entityId: data.requirementId,
            newValue: { shareableUrl, content },
        })

        return {
            applicationFormId: appForm._id?.toString(),
            shareableUrl,
            content
        }
    }

    /**
     * Regenerate Specific Content
     */
    static async regenerateContent(user: UserContext, data: RegenerateContentInput) {
        await connectDB()

        const requirement = await Requirement.findById(data.requirementId)
        if (!requirement) throw new NotFoundError("Requirement not found")

        if (!this.ensureRole(user, requirement.accountOwnerId.toString())) {
            throw new ForbiddenError("Forbidden")
        }

        const appForm = await ApplicationForm.findOne({ requirementId: data.requirementId })
        if (!appForm) throw new AppError("Application form not generated yet")

        const formUrl = this.absoluteUrl(appForm.shareableUrl)
        const updated = await regenerateSingleContent(data.requirementId, data.type, formUrl)

        await AuditLog.create({
            userId: user.id,
            action: "REQUIREMENT_CONTENT_REGENERATED",
            entity: "Requirement",
            entityId: data.requirementId,
            newValue: { type: data.type, content: updated },
        })

        return { type: data.type, content: updated }
    }

    /**
     * Get Public Form Data
     */
    static async getPublicForm(slug: string) {
        await connectDB()

        const shareableUrl = `/apply/${slug}`
        const appForm = await ApplicationForm.findOne({ shareableUrl, isActive: true })
        if (!appForm) throw new NotFoundError("Form not found")

        const requirement = await Requirement.findById(appForm.requirementId)
        if (!requirement) throw new NotFoundError("Requirement not found")

        if (['CLOSED_HIRED', 'CLOSED_NOT_HIRED', 'ON_HOLD'].includes(requirement.status)) {
            throw new AppError("This position is closed or on hold")
        }

        const company = await Company.findById(requirement.companyId)

        return {
            form: {
                id: appForm._id?.toString(),
                shareableUrl: appForm.shareableUrl,
                formFields: appForm.formFields,
            },
            requirement: {
                jobTitle: requirement.jobTitle,
                skills: requirement.skills,
                experienceMin: requirement.experienceMin,
                experienceMax: requirement.experienceMax,
                location: requirement.location,
                workMode: requirement.workMode,
                companyName: company?.name ?? "Company",
                status: requirement.status,
            },
        }
    }

    /**
     * Submit Application
     */
    static async submitApplication(data: SubmitApplicationInput) {
        await connectDB()

        const shareableUrl = `/apply/${data.slug}`
        const appForm = await ApplicationForm.findOne({ shareableUrl, isActive: true })
        if (!appForm) throw new AppError("Form not found or inactive")

        const requirement = await Requirement.findById(appForm.requirementId)
        if (!requirement) throw new NotFoundError("Requirement not found")

        if (['CLOSED_HIRED', 'CLOSED_NOT_HIRED', 'ON_HOLD'].includes(requirement.status)) {
            throw new AppError("This position is closed or on hold")
        }

        const allowedStatuses = ['ACTIVE', 'SOURCING']
        if (!allowedStatuses.includes(requirement.status)) {
            throw new AppError("Applications are not accepted for this status")
        }

        try {
            const candidate = await Candidate.create({
                requirementId: requirement._id,
                applicationFormId: appForm._id,
                name: data.name,
                phone: data.phone,
                email: data.email.toLowerCase(),
                resumeUrl: data.resumeUrl,
                skills: data.skills,
                college: data.college,
                yearsExperience: data.yearsExperience,
            })

            await AuditLog.create({
                userId: requirement.accountOwnerId,
                action: "APPLICATION_SUBMITTED",
                entity: "Candidate",
                entityId: candidate._id.toString(),
                newValue: { requirementId: requirement._id.toString(), email: candidate.email },
            })

            return { id: candidate._id.toString() }
        } catch (error: any) {
            if (error?.code === 11000) {
                throw new ConflictError("Candidate already applied for this requirement")
            }
            throw error
        }
    }

    /**
     * Preview Templates
     */
    static getTemplates() {
        return templates
    }
}
