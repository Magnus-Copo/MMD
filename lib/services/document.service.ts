
import connectDB from "@/lib/db/mongodb"
import Document from "@/lib/db/models/Document"
import AuditLog from "@/lib/db/models/AuditLog"
import { ForbiddenError, NotFoundError } from "@/lib/core/app-error"
import { serializeDoc, serializeDocs } from "@/lib/utils/serialize"
import { z } from "zod"
import { DocumentSchema, DocumentEntitySchema } from "@/lib/validators/common"

export const ListDocumentsSchema = z.object({
    entityType: DocumentEntitySchema,
    entityId: z.string().min(1),
})

export type UploadDocumentInput = z.infer<typeof DocumentSchema>
export type ListDocumentsInput = z.infer<typeof ListDocumentsSchema>

interface UserContext {
    id: string
    role: string
}

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "COORDINATOR", "RECRUITER"] as const

export class DocumentService {
    /**
     * Upload Document
     */
    static async upload(user: UserContext, data: UploadDocumentInput) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const doc = await Document.create({
            ...data,
            uploadedBy: user.id,
        })

        await AuditLog.create({
            userId: user.id,
            action: "DOCUMENT_UPLOADED",
            entity: data.entityType,
            entityId: data.entityId,
            newValue: { documentId: doc._id.toString(), name: doc.name },
        })

        return serializeDoc(doc.toObject())
    }

    /**
     * List Documents
     */
    static async list(user: UserContext, data: ListDocumentsInput) {
        // Any auth user can list? Original code: checked session?.user.
        // Assuming roles? Original code: `allow` function existed but list just checked session. 
        // We will default to standard allowed roles logic for consistency or open reading?
        // Original listDocumentsAction just checked session.

        await connectDB()
        const docs = await Document.find({
            entityType: data.entityType,
            entityId: data.entityId,
        }).sort({ createdAt: -1 }).lean()

        return serializeDocs(docs)
    }

    /**
     * Get Document
     */
    static async getById(user: UserContext, documentId: string) {
        // Original: Checked session. 
        await connectDB()
        const doc = await Document.findById(documentId).lean()
        if (!doc) throw new NotFoundError("Document not found")

        return serializeDoc(doc)
    }

    /**
     * Delete Document
     */
    static async delete(user: UserContext, documentId: string) {
        if (!ALLOWED_ROLES.includes(user.role as any)) throw new ForbiddenError("Forbidden")

        await connectDB()

        const doc = await Document.findById(documentId)
        if (!doc) throw new NotFoundError("Document not found")

        // Only uploader or admin can delete
        if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) && doc.uploadedBy?.toString() !== user.id) {
            throw new ForbiddenError("Cannot delete documents uploaded by others")
        }

        const oldValue = doc.toObject()
        await Document.deleteOne({ _id: documentId })

        await AuditLog.create({
            userId: user.id,
            action: "DOCUMENT_DELETED",
            entity: "Document",
            entityId: documentId,
            oldValue,
        })

        return { success: true }
    }
}
