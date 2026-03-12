'use server'

import { revalidatePath } from 'next/cache'
import connectDB from '@/lib/db/mongodb'
import Requirement from '@/lib/db/models/Requirement'
import Company from '@/lib/db/models/Company'  // Import to register schema for populate
import Activity from '@/lib/db/models/Activity'
import { subDays } from 'date-fns'
import { applyRequirementRBAC } from '@/lib/auth/rbac'
import { getCurrentUser } from '@/lib/auth'
import { RequirementService } from '@/lib/services/requirement.service'

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
    group: 'RASHMI' | 'MANJUNATH' | 'SCRAPING' | 'LEADS'
    location: string
    locationType: string
    company: string
    companyId: string
    budget: string
    openings: number
    skills: string[]
    experienceMin: number
    experienceMax: number
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
    // Convert to Lakhs (100,000) instead of Thousands (1,000)
    if (salaryMin && salaryMax) {
        return `₹${(salaryMin / 100000).toFixed(1)}L - ₹${(salaryMax / 100000).toFixed(1)}L`
    }
    if (salaryMin) return `₹${(salaryMin / 100000).toFixed(1)}L+`
    return `Up to ₹${(salaryMax! / 100000).toFixed(1)}L`
}

function parseWorkMode(locationType: string | undefined): 'REMOTE' | 'HYBRID' | 'ONSITE' {
    const normalized = (locationType || '').trim().toLowerCase()
    if (normalized === 'hybrid') return 'HYBRID'
    if (normalized === 'on-site' || normalized === 'onsite') return 'ONSITE'
    return 'REMOTE'
}

function normalizeRequirementStatus(status: string | undefined) {
    switch (status) {
        case 'FILLED':
            return 'CLOSED_HIRED'
        case 'CANCELLED':
            return 'CLOSED_NOT_HIRED'
        default:
            return status || 'ACTIVE'
    }
}

function parseBudgetValue(token: string): number | undefined {
    const normalized = token.replace(/,/g, '').trim().toLowerCase()
    const numeric = Number.parseFloat(normalized)
    if (!Number.isFinite(numeric)) return undefined

    if (normalized.includes('cr')) return Math.round(numeric * 10000000)
    if (normalized.includes('lac') || normalized.includes('lakh') || /\d(?:\.\d+)?l\b/.test(normalized)) {
        return Math.round(numeric * 100000)
    }
    if (normalized.includes('k')) return Math.round(numeric * 1000)
    return Math.round(numeric)
}

function parseBudgetRange(budget: string | undefined): { salaryMin?: number; salaryMax?: number } {
    if (!budget?.trim()) return {}

    const matches = budget.match(/\d+(?:\.\d+)?\s*(?:cr|crore|lac|lakh|l|k)?/gi) || []
    const parsed = matches
        .map(parseBudgetValue)
        .filter((value): value is number => typeof value === 'number')

    if (parsed.length >= 2) {
        return { salaryMin: parsed[0], salaryMax: parsed[1] }
    }
    if (parsed.length === 1) {
        if (/up to|max/i.test(budget)) {
            return { salaryMax: parsed[0] }
        }
        return { salaryMin: parsed[0] }
    }

    return {}
}

function buildRequirementDescription(data: Pick<RequirementData, 'title' | 'company' | 'location' | 'budget' | 'skills' | 'description'>): string {
    const explicitDescription = data.description?.trim()
    if (explicitDescription && explicitDescription.length >= 50) {
        return explicitDescription
    }

    const fallback = [
        `Requirement for ${data.title} at ${data.company || 'the selected company'}.`,
        `Location: ${data.location || 'To be confirmed'}.`,
        `Budget: ${data.budget || 'To be finalized'}.`,
        `Core skills: ${(data.skills.length > 0 ? data.skills : ['General hiring']).join(', ')}.`,
        explicitDescription,
    ]
        .filter(Boolean)
        .join(' ')
        .trim()

    return fallback.length >= 50
        ? fallback
        : `${fallback} Additional hiring details will be added during intake.`.trim()
}

function transformRequirement(req: any) {
    const company = req.companyId && typeof req.companyId === 'object'
        ? req.companyId.name || 'Unknown Company'
        : req.company || 'Unknown Company'
    const companyId = req.companyId && typeof req.companyId === 'object'
        ? req.companyId._id?.toString() || ''
        : req.companyId?.toString() || ''
    const owner = req.accountOwnerId && typeof req.accountOwnerId === 'object'
        ? req.accountOwnerId.name || 'Unassigned'
        : req.owner || 'Unassigned'

    return {
        ...req,
        id: req._id.toString(),
        _id: req._id.toString(),
        title: req.jobTitle || req.title || 'Untitled Position',
        owner,
        company,
        companyId,
        filledPositions: req.filledPositions ?? 0,
        submissions: req.submissions ?? 0,
        interviews: req.interviews ?? 0,
        priority: req.priority || 'Medium',
        locationType: formatWorkMode(req.workMode),
        budget: formatBudget(req.salaryMin, req.salaryMax),
        status: req.status || 'ACTIVE',
        openings: req.openings ?? 1,
        description: req.fullDescription || req.description,
        deadline: req.interviewClosingDate
            ? new Date(req.interviewClosingDate).toISOString().slice(0, 10)
            : req.deadline,
        experienceMin: req.experienceMin ?? 0,
        experienceMax: req.experienceMax ?? 0,
    }
}

    function getActionErrorMessage(error: unknown, fallback: string) {
        if (error instanceof Error && error.message) {
            return error.message
        }
        return fallback
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

            return transformRequirement({
                ...req,
                lastActivityAt: lastActivity,
                stalled,
            })
        })

        const filteredByStalled = filters.stalled ? transformed.filter((req: any) => req.stalled) : transformed

        return { success: true, data: JSON.parse(JSON.stringify(filteredByStalled)) }
    } catch (error) {
        console.error('Error fetching requirements:', error)
            return { success: false, error: getActionErrorMessage(error, 'Failed to fetch requirements') }
    }
}

export async function createRequirement(data: RequirementData) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        // Basic RBAC: Only Admin/Recruiter/Coordinator can create
        if (user.role === 'SCRAPER') throw new Error('Permission denied')

        await connectDB()

        const payload = {
            companyId: data.companyId,
            jobTitle: data.title.trim(),
            fullDescription: buildRequirementDescription(data),
            skills: data.skills.length > 0 ? data.skills : ['General hiring'],
            experienceMin: data.experienceMin,
            experienceMax: data.experienceMax,
            ...parseBudgetRange(data.budget),
            openings: data.openings,
            workMode: parseWorkMode(data.locationType),
            location: data.location.trim() || 'Remote',
            interviewClosingDate: data.deadline ? new Date(data.deadline) : undefined,
            group: data.group,
            accountOwnerId: user.id,
            status: normalizeRequirementStatus(data.status) as any,
        }

        const newRequirement = await RequirementService.create(
            { id: user.id, role: user.role },
            payload as any
        )

        const created = await Requirement.findById(newRequirement._id)
            .populate('accountOwnerId', 'name')
            .populate('companyId', 'name')
            .lean()

        if (!created) {
            throw new Error('Requirement created but could not be reloaded')
        }

        revalidatePath('/dashboard/requirements')
        revalidatePath('/dashboard')
        return { success: true, data: JSON.parse(JSON.stringify(transformRequirement(created))) }
    } catch (error) {
        console.error('Error creating requirement:', error)
            return { success: false, error: getActionErrorMessage(error, 'Failed to create requirement') }
    }
}

export async function updateRequirement(id: string, data: Partial<RequirementData>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await connectDB()

        const rbacFilter = applyRequirementRBAC(user, { _id: id, deletedAt: null })
        const existing = await Requirement.findOne(rbacFilter)
            .populate('companyId', 'name')
            .populate('accountOwnerId', 'name')
            .lean()

        if (!existing) throw new Error('Requirement not found or permission denied')

        const existingView = transformRequirement(existing)

        const mergedForDescription: RequirementData = {
            title: data.title ?? existing.jobTitle,
            mmdId: existing.mmdId,
            status: data.status ?? existing.status,
            priority: data.priority ?? existingView.priority ?? 'Medium',
            group: data.group ?? existing.group,
            location: data.location ?? existing.location,
            locationType: data.locationType ?? formatWorkMode(existing.workMode),
            company: data.company ?? existingView.company,
            companyId: data.companyId ?? existingView.companyId,
            budget: data.budget ?? formatBudget(existing.salaryMin, existing.salaryMax),
            openings: data.openings ?? existing.openings,
            skills: data.skills ?? existing.skills,
            experienceMin: data.experienceMin ?? existing.experienceMin,
            experienceMax: data.experienceMax ?? existing.experienceMax,
            description: data.description ?? existing.fullDescription,
            deadline: data.deadline ?? (existing.interviewClosingDate ? new Date(existing.interviewClosingDate).toISOString().slice(0, 10) : undefined),
        }

        const mappedUpdate: Record<string, unknown> = {}

        if (data.title !== undefined) mappedUpdate.jobTitle = data.title.trim()
        if (data.description !== undefined) mappedUpdate.fullDescription = buildRequirementDescription(mergedForDescription)
        if (data.skills !== undefined) mappedUpdate.skills = data.skills.length > 0 ? data.skills : ['General hiring']
        if (data.experienceMin !== undefined) mappedUpdate.experienceMin = data.experienceMin
        if (data.experienceMax !== undefined) mappedUpdate.experienceMax = data.experienceMax
        if (data.budget !== undefined) Object.assign(mappedUpdate, parseBudgetRange(data.budget))
        if (data.openings !== undefined) mappedUpdate.openings = data.openings
        if (data.locationType !== undefined) mappedUpdate.workMode = parseWorkMode(data.locationType)
        if (data.location !== undefined) mappedUpdate.location = data.location.trim()
        if (data.deadline !== undefined && data.deadline) mappedUpdate.interviewClosingDate = new Date(data.deadline)
        if (data.group !== undefined) mappedUpdate.group = data.group
        if (data.companyId !== undefined) mappedUpdate.companyId = data.companyId
        if (data.status !== undefined) mappedUpdate.status = normalizeRequirementStatus(data.status)

        await RequirementService.update(
            { id: user.id, role: user.role },
            id,
            mappedUpdate
        )

        const updated = await Requirement.findById(id)
            .populate('accountOwnerId', 'name')
            .populate('companyId', 'name')
            .lean()

        if (!updated) throw new Error('Requirement not found after update')

        revalidatePath('/dashboard/requirements')
        revalidatePath('/dashboard')
        return { success: true, data: JSON.parse(JSON.stringify(transformRequirement(updated))) }
    } catch (error) {
        console.error('Error updating requirement:', error)
            return { success: false, error: getActionErrorMessage(error, 'Failed to update requirement') }
    }
}

export async function deleteRequirement(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await RequirementService.delete({ id: user.id, role: user.role }, id)

        revalidatePath('/dashboard/requirements')
        revalidatePath('/dashboard')
        return { success: true, message: 'Requirement deleted' }
    } catch (error) {
        console.error('Error deleting requirement:', error)
            return { success: false, error: getActionErrorMessage(error, 'Failed to delete requirement') }
    }
}

export async function freezeRequirement(id: string, comment?: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')
        const requirement = await RequirementService.freeze({ id: user.id, role: user.role }, id, comment)

        revalidatePath('/dashboard/requirements')
        revalidatePath('/dashboard')
        return { success: true, data: JSON.parse(JSON.stringify(requirement)) }
    } catch (error) {
        console.error('Error freezing requirement:', error)
            return { success: false, error: getActionErrorMessage(error, 'Failed to freeze requirement') }
    }
}

export async function reassignRequirement(id: string, newOwnerId: string, comment?: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')
        const requirement = await RequirementService.reassign({ id: user.id, role: user.role }, id, newOwnerId, comment)

        revalidatePath('/dashboard/requirements')
        revalidatePath('/dashboard')
        return { success: true, data: JSON.parse(JSON.stringify(requirement)) }
    } catch (error) {
        console.error('Error reassigning requirement:', error)
            return { success: false, error: getActionErrorMessage(error, 'Failed to reassign requirement') }
    }
}
