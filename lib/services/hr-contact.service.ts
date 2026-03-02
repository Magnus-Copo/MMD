
import connectDB from "@/lib/db/mongodb"
import HRContact from "@/lib/db/models/HRContact"
import Company from "@/lib/db/models/Company"
import AuditLog from "@/lib/db/models/AuditLog"
import { AppError, ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { serializeDoc, serializeDocs } from "@/lib/utils/serialize"
import { z } from "zod"

// Schemas
export const HRContactSchema = z.object({
    companyId: z.string().min(1),
    name: z.string().min(2),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    designation: z.string().optional(),
    isPrimary: z.boolean().default(false),
})

export const UpdateHRContactSchema = HRContactSchema.partial().extend({
    id: z.string().min(1),
})

// Types
export type CreateHRContactInput = z.infer<typeof HRContactSchema>
export type UpdateHRContactInput = z.infer<typeof UpdateHRContactSchema>

interface UserContext {
    id: string
    role: string
}

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "RECRUITER"] as const

export class HRContactService {

    /**
     * Create HR Contact
     */
    static async create(user: UserContext, data: CreateHRContactInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const company = await Company.findOne({ _id: data.companyId, deletedAt: null })
        if (!company) throw new NotFoundError("Company not found")

        // If isPrimary, unset other primary contacts for this company
        if (data.isPrimary) {
            await HRContact.updateMany(
                { companyId: data.companyId, isPrimary: true },
                { isPrimary: false }
            )
        }

        const contact = await HRContact.create({
            ...data,
        })

        await AuditLog.create({
            userId: user.id,
            action: "HR_CONTACT_CREATED",
            entity: "HRContact",
            entityId: contact._id.toString(),
            newValue: data,
        })

        return serializeDoc(contact.toObject())
    }

    /**
     * Get HR Contacts for Company
     */
    static async getByCompany(user: UserContext, companyId: string) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const contacts = await HRContact.find({ companyId, deletedAt: null })
            .sort({ isPrimary: -1, name: 1 })
            .lean()

        return serializeDocs(contacts)
    }

    /**
     * Update HR Contact
     */
    static async update(user: UserContext, data: UpdateHRContactInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const contact = await HRContact.findOne({ _id: data.id, deletedAt: null })
        if (!contact) throw new NotFoundError("Contact not found")

        const oldValue = contact.toObject()

        // If setting as primary, unset others
        if (data.isPrimary && !contact.isPrimary) {
            await HRContact.updateMany(
                { companyId: contact.companyId, isPrimary: true, _id: { $ne: contact._id } },
                { isPrimary: false }
            )
        }

        if (data.name !== undefined) contact.name = data.name
        if (data.phone !== undefined) contact.phone = data.phone
        if (data.email !== undefined) contact.email = data.email
        if (data.designation !== undefined) contact.designation = data.designation
        if (data.isPrimary !== undefined) contact.isPrimary = data.isPrimary

        await contact.save()

        await AuditLog.create({
            userId: user.id,
            action: "HR_CONTACT_UPDATED",
            entity: "HRContact",
            entityId: contact._id.toString(),
            oldValue,
            newValue: contact.toObject(),
        })

        return serializeDoc(contact.toObject())
    }

    /**
     * Delete HR Contact (Soft Delete)
     */
    static async delete(user: UserContext, contactId: string) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const contact = await HRContact.findOne({ _id: contactId, deletedAt: null })
        if (!contact) throw new NotFoundError("Contact not found")

        // Check if it's the only contact
        const contactCount = await HRContact.countDocuments({
            companyId: contact.companyId,
            deletedAt: null
        })

        if (contactCount <= 1) {
            throw new AppError("Cannot delete the only HR contact for this company")
        }

        // Handle primary reassignment if deleting primary
        if (contact.isPrimary) {
            const nextPrimary = await HRContact.findOne({
                companyId: contact.companyId,
                _id: { $ne: contact._id },
                deletedAt: null,
            })
            if (nextPrimary) {
                nextPrimary.isPrimary = true
                await nextPrimary.save()
            }
        }

        contact.deletedAt = new Date()
        await contact.save()

        await AuditLog.create({
            userId: user.id,
            action: "HR_CONTACT_DELETED",
            entity: "HRContact",
            entityId: contactId,
            oldValue: { deletedAt: null },
            newValue: { deletedAt: contact.deletedAt },
        })

        return { success: true }
    }

    /**
     * Set Primary
     */
    static async setPrimary(user: UserContext, contactId: string) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        // Reuse update logic for consistency, or keep specialized method
        // Implementing specialized logic to match previous explicit action
        await connectDB()

        const contact = await HRContact.findOne({ _id: contactId, deletedAt: null })
        if (!contact) throw new NotFoundError("Contact not found")

        await HRContact.updateMany(
            { companyId: contact.companyId, isPrimary: true },
            { isPrimary: false }
        )

        contact.isPrimary = true
        await contact.save()

        await AuditLog.create({
            userId: user.id,
            action: "HR_CONTACT_SET_PRIMARY",
            entity: "HRContact",
            entityId: contactId,
            newValue: { isPrimary: true },
        })

        return serializeDoc(contact.toObject())
    }
}
