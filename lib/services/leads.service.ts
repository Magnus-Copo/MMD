import connectDB from "@/lib/db/mongodb"
import Lead from "@/lib/db/models/Lead"
import Company from "@/lib/db/models/Company"
import HRContact from "@/lib/db/models/HRContact"
import AuditLog from "@/lib/db/models/AuditLog"
import { AppError, ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { CompanySchema, LeadSchema, LeadStatusSchema, AddLeadActivitySchema } from "@/lib/validators/common"
import { z } from "zod"
import { applyLeadRBAC, canModifyLead, canDeleteLead } from "@/lib/auth/rbac"
import { UserRole } from "@/lib/db/models/User"

// Types

type LeadInput = z.infer<typeof LeadSchema>
type LeadStatus = z.infer<typeof LeadStatusSchema>
type AddActivityInput = z.infer<typeof AddLeadActivitySchema>

interface UserContext {
    id: string
    role: UserRole
    name?: string
}

export class LeadsService {
    /**
     * Get all leads with RBAC filtering
     */
    static async getAll(user: UserContext, filters?: { status?: LeadStatus }) {
        await connectDB()

        const baseFilter: Record<string, unknown> = {}
        if (filters?.status) baseFilter.status = filters.status

        const { allowed, filter } = applyLeadRBAC({ role: user.role, _id: user.id }, baseFilter)

        if (!allowed) {
            throw new ForbiddenError("Insufficient permissions to view leads")
        }

        const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean()
        return leads
    }

    /**
     * Create a new lead
     */
    static async create(user: UserContext, data: LeadInput) {
        // Permission check (Admin, Coordinator, Scraper)
        const allowedCreators = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "SCRAPER"]
        if (!allowedCreators.includes(user.role)) {
            throw new ForbiddenError("You do not have permission to create leads")
        }

        await connectDB()

        const lead = await Lead.create({
            ...data,
            status: data.status ?? "NEW",
            assignedTo: data.assignedTo ?? user.id,
        })

        await AuditLog.create({
            userId: user.id,
            action: "LEAD_CREATED",
            entity: "Lead",
            entityId: lead._id.toString(),
            newValue: data,
        })

        return lead.toObject()
    }

    /**
     * Update an existing lead
     */
    static async update(user: UserContext, leadId: string, data: Partial<LeadInput>) {
        await connectDB()

        const lead = await Lead.findOne({ _id: leadId, deletedAt: null })
        if (!lead) {
            throw new NotFoundError("Lead not found")
        }

        // RBAC check for modification
        const rbacUser = { role: user.role, _id: user.id }
        if (!canModifyLead(rbacUser, { assignedTo: lead.assignedTo, deletedAt: lead.deletedAt })) {
            throw new ForbiddenError("You do not have permission to modify this lead")
        }

        const oldValue = lead.toObject()

        // Apply updates
        if (data.sourcePlatform !== undefined) lead.sourcePlatform = data.sourcePlatform
        if (data.companyName !== undefined) lead.companyName = data.companyName
        if (data.sector !== undefined) lead.sector = data.sector
        if (data.contactName !== undefined) lead.contactName = data.contactName
        if (data.contactPhone !== undefined) lead.contactPhone = data.contactPhone
        if (data.contactEmail !== undefined) lead.contactEmail = data.contactEmail
        if (data.confidenceScore !== undefined) lead.confidenceScore = data.confidenceScore
        if (data.notes !== undefined) lead.notes = data.notes
        if (data.status !== undefined) lead.status = data.status
        if (data.assignedTo !== undefined) lead.assignedTo = data.assignedTo

        await lead.save()

        await AuditLog.create({
            userId: user.id,
            action: "LEAD_UPDATED",
            entity: "Lead",
            entityId: lead._id.toString(),
            oldValue,
            newValue: lead.toObject(),
        })

        return lead.toObject()
    }

    /**
     * Delete lead (soft delete)
     */
    static async delete(user: UserContext, leadId: string) {
        if (!canDeleteLead({ role: user.role })) {
            throw new ForbiddenError("Forbidden")
        }

        await connectDB()

        const lead = await Lead.findOne({ _id: leadId, deletedAt: null })
        if (!lead) throw new NotFoundError("Lead not found")

        // Cannot delete converted leads
        if (lead.status === "CONVERTED") {
            throw new AppError("Cannot delete converted leads")
        }

        const oldValue = lead.toObject()

        // Soft delete
        lead.deletedAt = new Date()
        await lead.save()

        await AuditLog.create({
            userId: user.id,
            action: "LEAD_DELETED",
            entity: "Lead",
            entityId: leadId,
            oldValue,
        })

        return true
    }

    /**
     * Add activity
     */
    static async addActivity(user: UserContext, payload: AddActivityInput) {
        await connectDB()

        const lead = await Lead.findOne({ _id: payload.leadId, deletedAt: null })
        if (!lead) throw new NotFoundError("Lead not found")

        const rbacUser = { role: user.role, _id: user.id }
        if (!canModifyLead(rbacUser, { assignedTo: lead.assignedTo, deletedAt: lead.deletedAt })) {
            throw new ForbiddenError("Forbidden")
        }

        // Create new activity
        const newActivity = {
            type: payload.activity.type,
            summary: payload.activity.summary,
            outcome: payload.activity.outcome,
            date: payload.activity.date,
            time: payload.activity.time,
            createdBy: user.id,
            createdByName: user.name || 'Unknown',
            nextFollowUp: payload.activity.nextFollowUp,
        }

        // Add activity to array
        if (!lead.activities) {
            lead.activities = []
        }
        lead.activities.unshift(newActivity)

        // Update lead status if it was NEW and now has activity
        if (lead.status === 'NEW') {
            lead.status = 'CONTACTED'
        }

        // Update follow-up date if provided
        if (payload.activity.nextFollowUp) {
            lead.followUpDate = payload.activity.nextFollowUp
        }

        // Update last activity date
        lead.lastActivityDate = `${payload.activity.date} ${payload.activity.time}`

        await lead.save()

        await AuditLog.create({
            userId: user.id,
            action: "LEAD_ACTIVITY_ADDED",
            entity: "Lead",
            entityId: lead._id.toString(),
            newValue: newActivity,
        })

        return lead.toObject()
    }

    /**
     * Get Metrics
     */
    static async getMetrics(user: UserContext) {
        await connectDB()

        const { allowed, filter } = applyLeadRBAC({ role: user.role, _id: user.id })
        if (!allowed) throw new ForbiddenError("Forbidden")

        const metrics = await Lead.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$sourcePlatform",
                    total: { $sum: 1 },
                    converted: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "CONVERTED"] }, 1, 0],
                        },
                    },
                    avgTimeToConvert: {
                        $avg: {
                            $cond: [
                                { $and: [{ $eq: ["$status", "CONVERTED"] }, { $ne: ["$convertedAt", null] }] },
                                { $divide: [{ $subtract: ["$convertedAt", "$createdAt"] }, 1000 * 60 * 60] },
                                null,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    sourcePlatform: "$_id",
                    conversionRate: {
                        $cond: [
                            { $eq: ["$total", 0] },
                            0,
                            { $multiply: [{ $divide: ["$converted", "$total"] }, 100] },
                        ],
                    },
                    avgTimeToConvertHours: "$avgTimeToConvert",
                },
            },
        ])

        return metrics
    }

    /**
     * Get Enhanced Metrics
     */
    static async getEnhancedMetrics(user: UserContext) {
        await connectDB()

        const { allowed, filter } = applyLeadRBAC({ role: user.role, _id: user.id })
        if (!allowed) throw new ForbiddenError("Forbidden")

        const leads = await Lead.find(filter).lean()
        const now = new Date()

        // Calculate metrics
        const total = leads.length
        const converted = leads.filter(l => l.status === 'CONVERTED').length
        const conversionRate = total > 0 ? (converted / total) * 100 : 0

        const followUpsDue = leads.filter(l => {
            if (!l.followUpDate) return false
            const followUp = new Date(l.followUpDate)
            return followUp <= now && l.status !== 'CONVERTED'
        }).length

        const overdue = leads.filter(l => {
            if (!l.followUpDate) return false
            const followUp = new Date(l.followUpDate)
            const daysBehind = Math.floor((now.getTime() - followUp.getTime()) / (1000 * 60 * 60 * 24))
            return daysBehind > 0 && l.status !== 'CONVERTED'
        }).length

        const avgConfidence = total > 0
            ? Math.round(leads.reduce((acc, l) => acc + l.confidenceScore, 0) / total)
            : 0

        // By status
        const byStatus: Record<string, number> = {}
        leads.forEach(l => {
            byStatus[l.status] = (byStatus[l.status] || 0) + 1
        })

        // By source
        const sourceMap = new Map<string, number>()
        leads.forEach(l => {
            const count = sourceMap.get(l.sourcePlatform) || 0
            sourceMap.set(l.sourcePlatform, count + 1)
        })
        const bySource = Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }))

        // Calculate conversion time stats
        const convertedLeads = leads.filter(l => l.status === 'CONVERTED' && l.convertedAt && l.createdAt)
        const avgDaysToConvert = convertedLeads.length > 0
            ? convertedLeads.reduce((acc, l) => {
                const created = new Date(l.createdAt!)
                const converted = new Date(l.convertedAt!)
                return acc + (converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
            }, 0) / convertedLeads.length
            : 0

        // Calculate contact time stats
        const contactedLeads = leads.filter(l =>
            ['CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'CONVERTED'].includes(l.status) &&
            l.lastActivityDate &&
            l.createdAt
        )
        const avgDaysToContact = contactedLeads.length > 0
            ? contactedLeads.reduce((acc, l) => {
                const created = new Date(l.createdAt!)
                const firstActivity = new Date(l.lastActivityDate!)
                return acc + Math.max(0, (firstActivity.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
            }, 0) / contactedLeads.length
            : 0

        return {
            total,
            converted,
            conversionRate,
            followUpsDue,
            overdue,
            avgConfidence,
            byStatus,
            bySource,
            avgDaysToContact,
            avgDaysToConvert,
        }
    }

    /**
     * Helper to build case-insensitive regex
     */
    private static buildCaseInsensitive(value: string) {
        const specials = '.^$|?*+()[]{}\\'
        const escaped = value
            .split('')
            .map((char) => (specials.includes(char) ? `\\${char}` : char))
            .join('')
        return new RegExp(`^${escaped}$`, 'i')
    }

    /**
     * Convert Lead to Company
     */
    static async convertToCompany(user: UserContext, leadId: string) {
        // Coordinator or Admin required
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) && user.role !== "COORDINATOR") {
            throw new ForbiddenError("Only Coordinators or Admins can convert leads")
        }

        await connectDB()

        const lead = await Lead.findOne({ _id: leadId, deletedAt: null })
        if (!lead) throw new NotFoundError("Lead not found")

        if (lead.status === "CONVERTED" && lead.convertedToCompanyId) {
            return { lead: lead.toObject(), alreadyConverted: true, company: await Company.findById(lead.convertedToCompanyId).lean() }
        }

        if (!lead.contactEmail && !lead.contactPhone) {
            throw new AppError("Add contact email or phone before converting this lead")
        }

        // Check for existing company
        const existingCompany = await Company.findOne({
            name: this.buildCaseInsensitive(lead.companyName.trim()),
            deletedAt: null,
        }).lean()

        if (existingCompany) {
            // Link to existing
            lead.status = "CONVERTED"
            lead.convertedToCompanyId = existingCompany._id.toString()
            lead.convertedAt = new Date()
            lead.convertedBy = user.id
            await lead.save()

            await AuditLog.create({
                userId: user.id,
                action: "LEAD_CONVERTED",
                entity: "Lead",
                entityId: lead._id.toString(),
                newValue: { companyId: lead.convertedToCompanyId, convertedAt: lead.convertedAt },
            })

            return { lead: lead.toObject(), company: existingCompany }
        }

        // Create new company
        const companyPayload = CompanySchema.parse({
            name: lead.companyName,
            category: "Prospect",
            sector: lead.sector,
            location: "Unknown",
            website: undefined,
            hiringType: "PERMANENT",
            source: "LEAD",
            mouStatus: "NOT_STARTED",
            mouDocumentUrl: undefined,
            paymentTerms: undefined,
            assignedCoordinatorId: user.id,
            hrContacts: [
                {
                    name: lead.contactName || "Primary Contact",
                    phone: lead.contactPhone || undefined,
                    email: lead.contactEmail || undefined,
                    isPrimary: true,
                },
            ],
        })

        const { hrContacts, ...companyData } = companyPayload
        const company = await Company.create(companyData)

        // Insert contacts
        await HRContact.insertMany(hrContacts.map((c: any) => ({ ...c, companyId: company._id })))

        // Update Lead
        lead.status = "CONVERTED"
        lead.convertedToCompanyId = company._id.toString()
        lead.convertedAt = new Date()
        lead.convertedBy = user.id
        await lead.save()

        await AuditLog.create({
            userId: user.id,
            action: "LEAD_CONVERTED",
            entity: "Lead",
            entityId: lead._id.toString(),
            newValue: { companyId: company._id.toString(), convertedAt: lead.convertedAt },
        })

        return { lead: lead.toObject(), company: company.toObject() }
    }
}
