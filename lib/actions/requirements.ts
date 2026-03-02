'use server'

import { revalidatePath } from 'next/cache'
import connectDB from '@/lib/db/mongodb'
import Requirement from '@/lib/db/models/Requirement'
import Company from '@/lib/db/models/Company'  // Import to register schema for populate
import Activity from '@/lib/db/models/Activity'
import { subDays } from 'date-fns'
import { applyRequirementRBAC } from '@/lib/auth/rbac'
import { getCurrentUser } from '@/lib/auth'

// Ensure Company schema is registered (used by populate)
 
const _Company = Company

const STALLED_DAYS = Number(process.env.DASHBOARD_STALLED_DAYS ?? 15)
const ACTIVE_STATUSES = ['PENDING_INTAKE', 'AWAITING_JD', 'ACTIVE', 'SOURCING', 'INTERVIEWING', 'OFFER']

// Types
export interface RequirementData {
    title: string
    mmdId?: string
    status: string
    priority: string
    location: string
    locationType: string
    company: string
    companyId: string
    budget: string
    openings: number
    skills: string[]
    description?: string
    deadline?: string
}

/**
 * Format workMode enum (DB) to locationType display string (Frontend)
 */
function formatWorkMode(workMode: string | undefined): string {
    const map: Record<string, string> = {
        'REMOTE': 'Remote',
        'HYBRID': 'Hybrid',
        'ONSITE': 'On-site',
    }
    return map[workMode || ''] || 'Remote'
}

/**
 * Format salary range into readable budget string
 */
function formatBudget(salaryMin?: number, salaryMax?: number): string {
    if (!salaryMin && !salaryMax) return 'Not specified'
    if (salaryMin && salaryMax) {
        return `$${(salaryMin / 1000).toFixed(0)}K - $${(salaryMax / 1000).toFixed(0)}K`
    }
    if (salaryMin) return `$${(salaryMin / 1000).toFixed(0)}K+`
    return `Up to $${(salaryMax! / 1000).toFixed(0)}K`
}

export async function getRequirements(filters: any = {}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await connectDB()

        const rbacFilter = applyRequirementRBAC(user, { deletedAt: null })

        // Default to active pipeline unless a specific status is requested
        const statusFilter = !filters.status || filters.status === 'all'
            ? { status: { $in: ACTIVE_STATUSES } }
            : { status: filters.status }

        const query = { ...rbacFilter, ...filters, ...statusFilter }

        // Strip empty filters (except status which we handled above)
        Object.keys(query).forEach((key) => {
            if (key === 'status') return
            if (query[key] === 'all' || query[key] === '' || query[key] === undefined) {
                delete query[key]
            }
        })

        const requirements = await Requirement.find(query)
            .populate('accountOwnerId', 'name')
            .populate('companyId', 'name')
            .sort({ createdAt: -1 })
            .lean()

        // Compute last activity and stalled flag
        const activeRequirementIds = requirements
            .filter((req: any) => ['ACTIVE', 'SOURCING', 'INTERVIEWING'].includes(req.status))
            .map((req: any) => req._id)

        const activityAgg = await Activity.aggregate([
            { $match: { requirementId: { $in: activeRequirementIds } } },
            { $group: { _id: '$requirementId', lastActivity: { $max: '$createdAt' } } },
        ])

        const lastActivityMap = new Map<string, Date>(
            activityAgg.map((a: any) => [a._id.toString(), a.lastActivity as Date])
        )

        const stalledCutoff = subDays(new Date(), STALLED_DAYS)

        // Transform DB fields to match frontend interface with proper defaults
        const transformed = requirements.map((req: any) => {
            const lastActivity = lastActivityMap.get(req._id.toString()) || req.updatedAt || req.createdAt
            const stalled =
                ['ACTIVE', 'SOURCING', 'INTERVIEWING'].includes(req.status || '') &&
                lastActivity <= stalledCutoff

            return {
                ...req,
                id: req._id.toString(),
                // Map jobTitle to title (frontend field name)
                title: req.jobTitle || req.title || 'Untitled Position',
                owner: req.accountOwnerId?.name || 'Unassigned',
                company: req.companyId?.name || req.companyId || 'Unknown Company',
                // Provide defaults for fields not in DB to prevent NaN
                filledPositions: req.filledPositions ?? 0,
                submissions: req.submissions ?? 0,
                interviews: req.interviews ?? 0,
                priority: req.priority || 'Medium',
                // Map workMode to locationType display format
                locationType: formatWorkMode(req.workMode),
                // Format budget from salary range
                budget: req.budget || formatBudget(req.salaryMin, req.salaryMax),
                // Ensure status is provided
                status: req.status || 'ACTIVE',
                // Ensure openings has a default
                openings: req.openings ?? 1,
                lastActivityAt: lastActivity,
                stalled,
            }
        })

        const filteredByStalled = filters.stalled ? transformed.filter((req: any) => req.stalled) : transformed

        return { success: true, data: JSON.parse(JSON.stringify(filteredByStalled)) }
    } catch (error) {
        console.error('Error fetching requirements:', error)
        return { success: false, error: 'Failed to fetch requirements' }
    }
}

export async function createRequirement(data: RequirementData) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        // Basic RBAC: Only Admin/Recruiter/Coordinator can create
        if (user.role === 'SCRAPER') throw new Error('Permission denied')

        await connectDB()

        // Generate ID if missing (or let DB/Schema handle it?)
        // Schema doesn't auto-gen mmdId easily, we might need logic. 
        // For now, trust input or generate simple one.
        const mmdId = data.mmdId || `MMD-R-${Date.now().toString().slice(-4)}`

        const newRequirement = await Requirement.create({
            ...data,
            mmdId,
            createdBy: user.id,
            accountOwnerId: user.id, // Default to creator
            group: 'GENERAL', // Default group
        })

        revalidatePath('/dashboard/requirements')
        return { success: true, data: JSON.parse(JSON.stringify(newRequirement)) }
    } catch (error) {
        console.error('Error creating requirement:', error)
        return { success: false, error: 'Failed to create requirement' }
    }
}

export async function updateRequirement(id: string, data: Partial<RequirementData>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await connectDB()

        const rbacFilter = applyRequirementRBAC(user, { _id: id })
        const updated = await Requirement.findOneAndUpdate(rbacFilter, data, { new: true }).lean()

        if (!updated) throw new Error('Requirement not found or permission denied')

        revalidatePath('/dashboard/requirements')
        return { success: true, data: JSON.parse(JSON.stringify(updated)) }
    } catch (error) {
        console.error('Error updating requirement:', error)
        return { success: false, error: 'Failed to update requirement' }
    }
}

export async function deleteRequirement(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await connectDB()

        const rbacFilter = applyRequirementRBAC(user, { _id: id })
        // Soft delete
        const deleted = await Requirement.findOneAndUpdate(rbacFilter, { deletedAt: new Date() }, { new: true })

        if (!deleted) throw new Error('Requirement not found or permission denied')

        revalidatePath('/dashboard/requirements')
        return { success: true, message: 'Requirement deleted' }
    } catch (error) {
        console.error('Error deleting requirement:', error)
        return { success: false, error: 'Failed to delete requirement' }
    }
}

export async function freezeRequirement(id: string, comment?: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')
        if (!['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(user.role)) throw new Error('Permission denied')

        await connectDB()

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null })
        if (!requirement) throw new Error('Requirement not found')

        if (['CLOSED_HIRED', 'CLOSED_NOT_HIRED', 'FILLED', 'CANCELLED'].includes(requirement.status)) {
            throw new Error('Cannot freeze a closed requirement')
        }

        requirement.status = 'ON_HOLD'
        await requirement.save()

        await Activity.create({
            requirementId: requirement._id!,
            userId: user.id as any,
            type: 'STATUS_CHANGE',
            summary: `Requirement frozen${comment ? `: ${comment}` : ''}`,
            outcome: 'PENDING',
            nextFollowUpDate: null,
        })

        revalidatePath('/dashboard/requirements')
        return { success: true, data: JSON.parse(JSON.stringify(requirement)) }
    } catch (error) {
        console.error('Error freezing requirement:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Failed to freeze requirement' }
    }
}

export async function reassignRequirement(id: string, newOwnerId: string, comment?: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')
        if (!['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(user.role)) throw new Error('Permission denied')

        await connectDB()

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null })
        if (!requirement) throw new Error('Requirement not found')

        const oldOwner = requirement.accountOwnerId?.toString()
        requirement.accountOwnerId = newOwnerId as any
        await requirement.save()

        await Activity.create({
            requirementId: requirement._id!,
            userId: user.id as any,
            type: 'STATUS_CHANGE',
            summary: `Requirement reassigned to ${newOwnerId}${comment ? `: ${comment}` : ''}`,
            outcome: 'PENDING',
            nextFollowUpDate: null,
            metadata: { fromOwner: oldOwner, toOwner: newOwnerId },
        })

        revalidatePath('/dashboard/requirements')
        return { success: true, data: JSON.parse(JSON.stringify(requirement)) }
    } catch (error) {
        console.error('Error reassigning requirement:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Failed to reassign requirement' }
    }
}
