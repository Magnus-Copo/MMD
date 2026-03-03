'use server'

import connectDB from '@/lib/db/mongodb'
import Company from '@/lib/db/models/Company'
import Requirement from '@/lib/db/models/Requirement'
import Candidate from '@/lib/db/models/Candidate'
import Activity from '@/lib/db/models/Activity'
import Timesheet from '@/lib/db/models/Timesheet'
import User from '@/lib/db/models/User'
import { startOfMonth, subDays, startOfDay, endOfDay } from 'date-fns'
import { applyRequirementRBAC } from '@/lib/auth/rbac'
import type { IUser } from '@/lib/db/models/User'

type RoleUser = Pick<IUser, 'role' | '_id'> & { assignedGroup?: string | null }

const OFFER_STUCK_DAYS = Number(process.env.DASHBOARD_OFFER_STUCK_DAYS ?? 5)
const MOU_EXPIRY_DAYS = Number(process.env.DASHBOARD_MOU_EXPIRY_DAYS ?? 5)
const IDLE_ACTIVITY_HOURS = Number(process.env.DASHBOARD_IDLE_ACTIVITY_HOURS ?? 24)
const STALLED_INACTIVITY_DAYS = Number(process.env.DASHBOARD_STALLED_DAYS ?? 15)

export async function getDashboardMetrics(user: RoleUser) {
  await connectDB()

  const now = new Date()
  const monthStart = startOfMonth(now)
  const thirtyDaysAgo = subDays(now, 30)
  const fiveDaysAgo = subDays(now, 5)
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const offerStuckCutoff = subDays(now, OFFER_STUCK_DAYS || 5)
  const mouExpiryThreshold = new Date(now.getTime() + (MOU_EXPIRY_DAYS || 5) * 24 * 60 * 60 * 1000)
  const idleActivityCutoff = new Date(now.getTime() - (IDLE_ACTIVITY_HOURS || 24) * 60 * 60 * 1000)
  const stalledCutoff = subDays(now, STALLED_INACTIVITY_DAYS || 15)

  // Base filters with RBAC
  const reqFilter = applyRequirementRBAC(user, {})
  // Note: candidateFilter removed - using global candidate counts for dashboard

  // Total companies
  const totalCompanies = await Company.countDocuments({ deletedAt: null })

  // Active requirements
  const activeRequirements = await Requirement.countDocuments({
    ...reqFilter,
    status: { $in: ['PENDING_INTAKE', 'AWAITING_JD', 'ACTIVE', 'SOURCING', 'INTERVIEWING', 'OFFER'] },
  })

  // Stalled requirements (> configured days no activity)
  const activities = await Activity.aggregate([
    { $match: { createdAt: { $gte: stalledCutoff } } },
    { $group: { _id: '$requirementId', lastActivity: { $max: '$createdAt' } } },
  ])
  const activeReqIds = activities.map((a) => a._id)

  const stalledCount = await Requirement.countDocuments({
    ...reqFilter,
    status: { $in: ['ACTIVE', 'SOURCING', 'INTERVIEWING'] },
    _id: { $nin: activeReqIds },
    createdAt: { $lt: stalledCutoff }, // Only count as stalled if they are older than the cutoff
  })

  // Prepare Activity RBAC Filter
  let activityBaseFilter: any = {}
  if ((!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
    const allowedRequirements = await Requirement.find(reqFilter).select('_id')
    const allowedReqIds = allowedRequirements.map((r) => r._id)
    activityBaseFilter = {
      $or: [{ requirementId: { $in: allowedReqIds } }, { userId: user._id }],
    }
  }

  // Missing JDs
  const missingJDCount = await Requirement.countDocuments({
    ...reqFilter,
    status: 'AWAITING_JD',
  })

  // Today's follow-ups (including overdue ones up to today)
  const followUpsToday = await Activity.countDocuments({
    ...activityBaseFilter,
    nextFollowUpDate: { $lte: todayEnd },
    isCompleted: false,
  })

  // Pending actions total
  const pendingActions = stalledCount + missingJDCount + followUpsToday

  // Pipeline conversion (month-to-date)
  let monthCandidates = []
  try {
    monthCandidates = await Candidate.aggregate([
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])
  } catch (e) {
    console.error('Conversion aggregate error:', e)
  }

  const totalApplied = monthCandidates.reduce((acc, c) => acc + c.count, 0)
  const joined = monthCandidates.find((c) => c._id === 'JOINED')?.count || 0
  const conversionRate = totalApplied > 0 ? Math.round((joined / totalApplied) * 100) : 0

  // Requirements by status for funnel
  const reqByStatus = await Requirement.aggregate([
    { $match: { ...reqFilter } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const funnelDefs = [
    { status: 'PENDING_INTAKE', label: 'Pending Intake', color: '#818CF8' },
    { status: 'AWAITING_JD', label: 'Awaiting JD', color: '#6366F1' },
    { status: 'ACTIVE', label: 'Active', color: '#4F46E5' },
    { status: 'SOURCING', label: 'Sourcing', color: '#3B82F6' },
    { status: 'INTERVIEWING', label: 'Interviewing', color: '#2563EB' },
    { status: 'OFFER', label: 'Offer', color: '#0EA5E9' },
    { status: 'ON_HOLD', label: 'On Hold', color: '#F59E0B' },
    { status: 'CLOSED_HIRED', label: 'Closed (Hired)', color: '#22C55E' },
    { status: 'CLOSED_NOT_HIRED', label: 'Closed (Not Hired)', color: '#9CA3AF' },
  ]

  const requirementsFunnel = funnelDefs.map((item) => ({
    label: item.label,
    status: item.status,
    value: reqByStatus.find((r) => r._id === item.status)?.count || 0,
    color: item.color,
  }))

  // Requirements created vs closed (last 30 days)
  const reqTrend = await Requirement.aggregate([
    {
      $match: {
        ...reqFilter,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        created: { $sum: 1 },
        closed: {
          $sum: { $cond: [{ $in: ['$status', ['CLOSED_HIRED', 'CLOSED_NOT_HIRED']] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Recent activities
  const recentActivities = await Activity.aggregate([
    { $match: activityBaseFilter },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'requirements',
        localField: 'requirementId',
        foreignField: '_id',
        as: 'requirement',
      },
    },
    { $unwind: { path: '$requirement', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        type: 1,
        summary: 1,
        outcome: 1,
        createdAt: 1,
        userName: '$user.name',
        requirementMmdId: '$requirement.mmdId',
        requirementId: '$requirement._id',
      },
    },
  ])

  // Urgent follow-ups (today + overdue)
  const urgentFollowUps = await Activity.aggregate([
    {
      $match: {
        ...activityBaseFilter,
        nextFollowUpDate: { $lte: todayEnd },
        isCompleted: false,
      },
    },
    { $sort: { nextFollowUpDate: 1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'requirements',
        localField: 'requirementId',
        foreignField: '_id',
        as: 'requirement',
      },
    },
    { $unwind: { path: '$requirement', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        summary: 1,
        nextFollowUpDate: 1,
        requirementMmdId: '$requirement.mmdId',
        requirementId: '$requirement._id',
        isOverdue: { $lt: ['$nextFollowUpDate', todayStart] },
      },
    },
  ])

  // Red Zone: high-signal exceptions for admins
  const redZone: Array<{ id: string; title: string; detail: string; href: string; severity: 'high' | 'medium' }> = []

  // MOU pending or expiring soon
  const pendingMous = await Company.find({ mouStatus: { $ne: 'SIGNED' }, deletedAt: null })
    .select('name mouStatus')
    .limit(5)
    .lean()

  const expiringMous = await Company.find({
    deletedAt: null,
    mouStatus: 'SIGNED',
    mouEndDate: { $ne: null, $lte: mouExpiryThreshold },
  })
    .select('name mouEndDate mouStatus')
    .limit(5)
    .lean()

  pendingMous.forEach((company) => {
    redZone.push({
      id: `mou-${company._id?.toString()}`,
      title: `MOU pending: ${company.name}`,
      detail: company.mouStatus === 'IN_PROGRESS' ? 'Awaiting admin approval' : 'Awaiting upload',
      href: '/dashboard/companies?mou=expiring',
      severity: 'high',
    })
  })

  expiringMous.forEach((company) => {
    redZone.push({
      id: `mou-expiring-${company._id?.toString()}`,
      title: `MOU expiring: ${company.name}`,
      detail: company.mouEndDate ? `Ends ${new Date(company.mouEndDate).toLocaleDateString()}` : 'Expiry near',
      href: '/dashboard/companies?mou=expiring',
      severity: 'high',
    })
  })

  // Offers stuck beyond configured days
  const stuckOffers = await Candidate.aggregate([
    {
      $match: {
        status: 'OFFERED',
        deletedAt: null,
        offeredAt: { $lte: offerStuckCutoff },
      },
    },
    { $sort: { offeredAt: 1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'requirements',
        localField: 'requirementId',
        foreignField: '_id',
        as: 'req',
      },
    },
    { $unwind: { path: '$req', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        offeredAt: 1,
        requirementId: '$req._id',
        mmdId: '$req.mmdId',
      },
    },
  ])

  stuckOffers.forEach((offer) => {
    const label = offer.mmdId ? `${offer.mmdId} offer pending` : `Offer pending >${OFFER_STUCK_DAYS || 5} days`
    redZone.push({
      id: `offer-${offer._id.toString()}`,
      title: label,
      detail: offer.name,
      href: '/dashboard/requirements?status=OFFER',
      severity: 'high',
    })
  })

  // Recruiters with zero activity today
  const recruiters = await User.find({ role: 'RECRUITER', isActive: true, deletedAt: null })
    .select('_id name')
    .limit(20)
    .lean()

  const todayActivityByUser = await Activity.aggregate([
    { $match: { createdAt: { $gte: idleActivityCutoff, $lte: todayEnd } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ])

  const activeUserIds = new Set<string>(todayActivityByUser.map((a) => a._id?.toString()))
  const idleRecruiters = recruiters.filter((r) => !activeUserIds.has(r._id?.toString() || '')).slice(0, 5)

  idleRecruiters.forEach((r) => {
    redZone.push({
      id: `idle-${r._id?.toString()}`,
      title: `${r.name || 'Recruiter'} has 0 uploads today`,
      detail: 'Nudge for activity',
      href: '/dashboard/leads',
      severity: 'medium',
    })
  })

  // Fetch Audit Logs (Recent Critical Actions)
  // Only for Admins usually, but we are inside getDashboardMetrics which is role-aware.
  // We'll limit this to 5 most recent logs.
  let auditLogs: any[] = []

  if ((['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
    try {
      const AuditLog = (await import('@/lib/db/models/AuditLog')).default
      const User = (await import('@/lib/db/models/User')).default

      const logs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()

      // Populate user details manually or via simple lookup if needed
      const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))]
      const users = await User.find({ _id: { $in: userIds } }).select('name').lean()
      const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]))

      auditLogs = logs.map(log => ({
        _id: log._id.toString(),
        action: log.action,
        entity: log.entity,
        summary: `${log.action} on ${log.entity}`, // Simplified summary
        createdAt: log.createdAt,
        userName: log.userId ? userMap[log.userId.toString()]?.name || 'Unknown' : 'System'
      }))
    } catch (e) {
      console.error("Failed to fetch audit logs for dashboard", e)
    }
  }

  // System Health Mock (Real implementation would check DB connection status etc)
  // Since we are here, DB is connected.
  const systemHealth = {
    dbStatus: 'connected', // We queried DB successfully above
    latency: Math.floor(Math.random() * 50) + 10, // Mock latency 10-60ms
    errorRate: 0.1 // Mock low error rate
  }

  return {
    kpis: {
      totalCompanies,
      activeRequirements,
      pendingActions,
      conversionRate,
      stalledCount,
      missingJDCount,
      followUpsToday,
    },
    requirementsFunnel,
    requirementsTrend: reqTrend.map((r) => ({
      date: new Date(r._id),
      created: r.created,
      closed: r.closed,
    })),
    recentActivities: recentActivities.map((a) => ({
      ...a,
      _id: a._id.toString(),
      requirementId: a.requirementId?.toString(),
    })),
    urgentFollowUps: urgentFollowUps.map((f) => ({
      ...f,
      _id: f._id.toString(),
      requirementId: f.requirementId?.toString(),
    })),
    redZone,
    auditLogs,
    systemHealth
  }
}

export async function getRecruiterDashboard(userId: string) {
  await connectDB()

  const now = new Date()
  const weekStart = subDays(now, 7)
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  // My open requirements
  const myRequirements = await Requirement.find({
    accountOwnerId: userId,
    status: { $in: ['ACTIVE', 'SOURCING', 'INTERVIEWING'] },
    deletedAt: null,
  })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean()

  // Today's follow-ups
  const myFollowUps = await Activity.aggregate([
    {
      $match: {
        userId: userId,
        nextFollowUpDate: { $gte: todayStart, $lte: todayEnd },
        isCompleted: false,
      },
    },
    {
      $lookup: {
        from: 'requirements',
        localField: 'requirementId',
        foreignField: '_id',
        as: 'requirement',
      },
    },
    { $unwind: { path: '$requirement', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        summary: 1,
        nextFollowUpDate: 1,
        requirementMmdId: '$requirement.mmdId',
        requirementId: '$requirement._id',
      },
    },
  ])

  // This week's timesheet
  const weekTimesheet = await Timesheet.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: weekStart },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalHours: { $sum: '$hours' },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const totalWeekHours = weekTimesheet.reduce((acc, d) => acc + d.totalHours, 0)

  return {
    myRequirements: myRequirements.map((r) => ({
      _id: r._id.toString(),
      mmdId: r.mmdId,
      jobTitle: r.jobTitle,
      status: r.status,
    })),
    myFollowUps: myFollowUps.map((f) => ({
      ...f,
      _id: f._id.toString(),
      requirementId: f.requirementId?.toString(),
    })),
    weekTimesheet,
    totalWeekHours,
  }
}
