
import connectDB from "@/lib/db/mongodb"
import Invoice from "@/lib/db/models/Invoice"
import Company from "@/lib/db/models/Company"
import Placement from "@/lib/db/models/Placement"
import AuditLog from "@/lib/db/models/AuditLog"
import { AppError, ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { serializeDoc } from "@/lib/utils/serialize"
import { z } from "zod"

export const InvoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'VOID'])

export const CreateInvoiceSchema = z.object({
    companyId: z.string().min(1),
    requirementId: z.string().optional(),
    placementId: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().default('INR'),
})

export const UpdateInvoiceStatusSchema = z.object({
    invoiceId: z.string().min(1),
    status: InvoiceStatusSchema,
    pdfUrl: z.string().url().optional(),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>
export type UpdateInvoiceStatusInput = z.infer<typeof UpdateInvoiceStatusSchema>

interface UserContext {
    id: string
    role: string
}

const VIEW_ROLES = ["SUPER_ADMIN", "ADMIN", "COORDINATOR"] as const
const ACTION_ROLES = ["SUPER_ADMIN", "COORDINATOR"] as const
export class InvoiceService {
    /**
     * Create Invoice
     */
    static async create(user: UserContext, data: CreateInvoiceInput) {
        if (!ACTION_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const company = await Company.findOne({ _id: data.companyId, deletedAt: null })
        if (!company) throw new NotFoundError("Company not found")

        let feeAmount = data.amount
        if (data.placementId) {
            const placement = await Placement.findById(data.placementId)
            if (!placement) throw new NotFoundError("Placement not found")
            if (placement.companyId.toString() !== data.companyId) {
                throw new AppError("Placement does not belong to this company")
            }
            if (placement.feeAmount) {
                feeAmount = placement.feeAmount
            }
        }

        const invoice = await Invoice.create({
            companyId: data.companyId,
            requirementId: data.requirementId ?? null,
            amount: feeAmount,
            currency: data.currency,
            status: 'DRAFT',
        })

        await AuditLog.create({
            userId: user.id,
            action: "INVOICE_CREATED",
            entity: "Invoice",
            entityId: invoice._id.toString(),
            newValue: { companyId: data.companyId, amount: feeAmount },
        })

        return serializeDoc(invoice.toObject())
    }

    /**
     * Get All Invoices
     */
    static async getAll(user: UserContext, filters?: { status?: string; companyId?: string }) {
        if (!VIEW_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const query: Record<string, unknown> = {}
        if (filters?.status) query.status = filters.status
        if (filters?.companyId) query.companyId = filters.companyId

        const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean()

        // Populate Company Details
        const companyIds = [...new Set(invoices.map(i => i.companyId.toString()))]
        const companies = await Company.find({ _id: { $in: companyIds } }).lean()
        const companyMap = Object.fromEntries(companies.map(c => [c._id.toString(), c]))

        return invoices.map(i => ({
            ...serializeDoc(i),
            company: companyMap[i.companyId.toString()] ? {
                _id: companyMap[i.companyId.toString()]._id.toString(),
                name: companyMap[i.companyId.toString()].name,
            } : null,
        }))
    }

    /**
     * Get Invoice By ID
     */
    static async getById(user: UserContext, invoiceId: string) {
        if (!VIEW_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const invoice = await Invoice.findById(invoiceId).lean()
        if (!invoice) throw new NotFoundError("Invoice not found")

        const company = await Company.findById(invoice.companyId).lean()

        return {
            ...serializeDoc(invoice),
            company: company ? {
                _id: company._id.toString(),
                name: company.name,
                location: company.location,
            } : null,
        }
    }

    /**
     * Update Status
     */
    static async updateStatus(user: UserContext, data: UpdateInvoiceStatusInput) {
        if (!ACTION_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const invoice = await Invoice.findById(data.invoiceId)
        if (!invoice) throw new NotFoundError("Invoice not found")

        const validTransitions: Record<string, string[]> = {
            DRAFT: ['SENT', 'VOID'],
            SENT: ['PAID', 'VOID'],
            PAID: [],
            VOID: [],
        }

        if (!validTransitions[invoice.status]?.includes(data.status)) {
            throw new AppError(`Cannot transition from ${invoice.status} to ${data.status}`)
        }

        const oldStatus = invoice.status
        invoice.status = data.status
        if (data.pdfUrl) invoice.pdfUrl = data.pdfUrl

        await invoice.save()

        await AuditLog.create({
            userId: user.id,
            action: "INVOICE_STATUS_UPDATED",
            entity: "Invoice",
            entityId: invoice._id.toString(),
            oldValue: { status: oldStatus },
            newValue: { status: invoice.status },
        })

        return serializeDoc(invoice.toObject())
    }

    /**
     * Delete Invoice (Draft Only)
     */
    static async delete(user: UserContext, invoiceId: string) {
        if (user.role !== "SUPER_ADMIN") throw new ForbiddenError("Forbidden")

        await connectDB()

        const invoice = await Invoice.findById(invoiceId)
        if (!invoice) throw new NotFoundError("Invoice not found")

        if (invoice.status !== 'DRAFT') throw new AppError("Only DRAFT invoices can be deleted")

        const oldValue = invoice.toObject()
        await Invoice.deleteOne({ _id: invoiceId })

        await AuditLog.create({
            userId: user.id,
            action: "INVOICE_DELETED",
            entity: "Invoice",
            entityId: invoiceId,
            oldValue,
        })

        return { success: true }
    }

    /**
     * Get Metrics
     */
    static async getMetrics(user: UserContext) {
        if (!VIEW_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()
        const now = new Date()

        const [paidMetrics, pendingMetrics, overdueMetrics] = await Promise.all([
            // Total Invoiced (Lifetime Value) - typically PAID invoices
            Invoice.aggregate([
                { $match: { status: 'PAID' } },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),
            // Outstanding (Pending) - Sent but not yet due
            Invoice.aggregate([
                {
                    $match: {
                        status: 'SENT',
                        dueDate: { $gte: now }
                    }
                },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]),
            // Overdue - Sent and past due (or explicitly marked OVERDUE if supported)
            Invoice.aggregate([
                {
                    $match: {
                        $or: [
                            { status: 'OVERDUE' },
                            { status: 'SENT', dueDate: { $lt: now } }
                        ]
                    }
                },
                { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ])
        ])

        return {
            totalInvoiced: paidMetrics[0]?.totalAmount || 0,
            countPaid: paidMetrics[0]?.count || 0,

            totalPending: pendingMetrics[0]?.totalAmount || 0,
            countPending: pendingMetrics[0]?.count || 0,

            totalOverdue: overdueMetrics[0]?.totalAmount || 0,
            countOverdue: overdueMetrics[0]?.count || 0
        }
    }
}
