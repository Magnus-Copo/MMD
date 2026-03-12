'use client'

import { Building2, Briefcase, AlertTriangle, TrendingUp, Rocket, Gauge, ArrowUpRight, Clock, Users, Target, Zap, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { FunnelChart, SimpleLineChart, ActivityTable, FollowUpList } from '@/components/dashboard'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { motion } from 'framer-motion'

interface Metrics {
  kpis: {
    totalCompanies: number
    activeRequirements: number
    pendingActions: number
    conversionRate: number
    stalledCount: number
    missingJDCount: number
    followUpsToday: number
  }
  requirementsFunnel: {
    label: string
    value: number
    color: string
    status?: string
  }[]
  requirementsTrend: {
    date: Date
    created: number
    closed: number
  }[]
  recentActivities: {
    _id: string
    type: string
    summary: string
    userName?: string
    requirementMmdId?: string
    requirementId?: string
    createdAt: Date | string
    outcome?: string
  }[]
  urgentFollowUps: {
    _id: string
    summary: string
    requirementMmdId?: string
    requirementId?: string
    nextFollowUpDate: Date | string
    isOverdue?: boolean
  }[]
  redZone: {
    id: string
    title: string
    detail: string
    href: string
    severity: 'high' | 'medium'
  }[]
  // [NEW] Added for System Health & Audit
  auditLogs?: {
    _id: string
    action: string
    entity: string
    summary: string
    createdAt: Date | string
    userName: string
  }[]
  systemHealth?: {
    dbStatus: string
    latency: number
    errorRate: number
  }
}

interface AdminDashboardProps {
  metrics: Metrics
  userName: string
}

// Stagger animation for cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
} as const

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
} as const

export function AdminDashboard({ metrics, userName }: Readonly<AdminDashboardProps>) {
  const { kpis, requirementsFunnel, requirementsTrend, recentActivities, urgentFollowUps, redZone } = metrics

  return (
    <div className="space-y-6 pb-6">
      {/* ========== HERO HEADER - Dark Gradient Banner ========== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.9, 0.33, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f6f8ff] via-[#edf0ff] to-[#f9faff] p-8 text-slate-900 shadow-[0_20px_60px_-30px_rgba(23,0,174,0.25)] border border-white/70 backdrop-blur-2xl"
      >
        {/* Animated decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-700/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-700">Mission Control</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Welcome back, {userName}
            </h1>
            <p className="text-slate-600 text-lg max-w-md">
              Your staffing operations at a glance. Let&apos;s make today count.
            </p>
          </div>

          {/* Date & Health Widget */}
          <div className="flex gap-4">
            {/* System Health */}


            <div className="bg-white/70 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/80 shadow-lg" suppressHydrationWarning>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-medium" suppressHydrationWarning>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
              <p className="text-3xl font-bold mt-1 tabular-nums text-slate-900" suppressHydrationWarning>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Stats Row - Glass Cards */}
        <div className="relative z-10 grid grid-cols-4 gap-4 mt-8">
          <Link href="/dashboard/requirements?status=ACTIVE" className="block bg-white/55 backdrop-blur-md rounded-2xl p-5 border border-white/70 hover:bg-white/70 transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between">
              <Briefcase className="h-5 w-5 text-brand-700" />
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/40" />
                Live
              </span>
            </div>
            <p className="text-4xl font-bold mt-3 tabular-nums text-slate-900 group-hover:scale-105 transition-transform origin-left">{kpis.activeRequirements}</p>
            <p className="text-slate-500 text-sm font-medium mt-1">Active Reqs</p>
          </Link>

          <Link href="/dashboard/companies" className="block bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/90 hover:bg-white transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-brand-700" />
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-4xl font-bold mt-3 tabular-nums text-slate-900 group-hover:scale-105 transition-transform origin-left">{kpis.totalCompanies}</p>
            <p className="text-slate-500 text-sm font-medium mt-1">Companies</p>
          </Link>

          <Link href="/dashboard/reports" className="block bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/90 hover:bg-white transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-brand-700" />
              <span className="text-xs text-slate-400 font-medium">Overall</span>
            </div>
            <p className="text-4xl font-bold mt-3 tabular-nums text-slate-900 group-hover:scale-105 transition-transform origin-left">{kpis.conversionRate}%</p>
            <p className="text-slate-500 text-sm font-medium mt-1">Conversion</p>
          </Link>

          <Link href="/dashboard/leads" className="block bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/90 hover:bg-white transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-amber-600 font-semibold">Today</span>
            </div>
            <p className="text-4xl font-bold mt-3 tabular-nums text-slate-900 group-hover:scale-105 transition-transform origin-left">{kpis.followUpsToday}</p>
            <p className="text-slate-500 text-sm font-medium mt-1">Follow-ups</p>
          </Link>
        </div>
      </motion.div>

      {/* ========== RED ZONE (Exceptions Only) ========== */}
      {redZone.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1"
        >
          <motion.div variants={cardVariants}>
            <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-orange-50 shadow-xl shadow-rose-200/40">
              <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.12),transparent_30%)]" />
              <div className="relative p-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Red Zone</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Exceptions that need action</h3>
                  <p className="text-sm text-slate-600 mt-1">Surfaced items only — no noise.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 border border-white/70 shadow-md">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
              </div>

              <div className="relative divide-y divide-rose-100/80">
                {redZone.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/80 transition-colors group"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm border text-sm font-semibold ${item.severity === 'high' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {item.severity === 'high' ? '!' : '•'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate group-hover:text-rose-700 transition-colors">{item.title}</p>
                      <p className="text-sm text-slate-600 truncate">{item.detail}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ========== ALERT CARDS ROW - Colorful Gradient Cards ========== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {/* Stalled Alert - Red */}
        <motion.div variants={cardVariants}>
          <Link
            href="/dashboard/requirements?status=STALLED"
            className="block group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fff3ef] via-[#ffe9df] to-[#fff7f2] p-6 text-slate-900 shadow-xl shadow-[#ff6b35]/15 hover:shadow-2xl hover:shadow-[#ff6b35]/25 hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 border border-[#ffd2c2]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-[#ff6b35]" />
                </div>
                <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-5xl font-bold tabular-nums">{kpis.stalledCount}</p>
              <p className="text-slate-900 font-semibold mt-2 text-lg">Stalled Requirements</p>
              <p className="text-slate-500 text-sm mt-1">Needs immediate attention</p>
            </div>
          </Link>
        </motion.div>

        {/* Missing JDs Alert - Amber */}
        <motion.div variants={cardVariants}>
          <Link
            href="/dashboard/requirements?status=AWAITING_JD"
            className="block group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fff8e6] via-[#fff2d0] to-[#fffbe9] p-6 text-slate-900 shadow-xl shadow-[#a69624]/15 hover:shadow-2xl hover:shadow-[#a69624]/25 hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 border border-[#eadb96]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-[#a69624]" />
                </div>
                <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-5xl font-bold tabular-nums">{kpis.missingJDCount}</p>
              <p className="text-slate-900 font-semibold mt-2 text-lg">Pending JDs</p>
              <p className="text-slate-500 text-sm mt-1">Complete job descriptions</p>
            </div>
          </Link>
        </motion.div>

        {/* Pending Actions - Purple */}
        <motion.div variants={cardVariants}>
          <Link
            href="/dashboard/requirements"
            className="block group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eef1ff] via-[#e3e8ff] to-[#f4f6ff] p-6 text-slate-900 shadow-xl shadow-brand-700/15 hover:shadow-2xl hover:shadow-brand-700/25 hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 border border-[#cfd8ff]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg">
                  <Zap className="h-6 w-6 text-brand-700" />
                </div>
                <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-5xl font-bold tabular-nums">{kpis.pendingActions}</p>
              <p className="text-slate-900 font-semibold mt-2 text-lg">Pending Actions</p>
              <p className="text-slate-500 text-sm mt-1">Tasks awaiting your input</p>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* ========== MAIN CONTENT GRID ========== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Pipeline Trend - Takes 2 cols */}
        <motion.div variants={cardVariants} className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 h-full hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Pipeline Trend</h3>
                <p className="text-sm text-slate-500 mt-1">Created vs Closed · Last 30 days</p>
              </div>
              <LiveBadge />
            </div>
            <div className="h-72">
              <SimpleLineChart data={requirementsTrend} title="" />
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div variants={cardVariants}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 h-full hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl shadow-md">
                <Rocket className="h-5 w-5 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>
                <p className="text-sm text-slate-500">Jump to key tasks</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/requirements?action=new"
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-brand-50 to-white border border-brand-200/60 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-100 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-100 rounded-lg shadow-sm">
                    <Briefcase className="h-4 w-4 text-brand-700" />
                  </div>
                  <span className="font-semibold text-slate-700">New Requirement</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/dashboard/companies"
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg shadow-sm">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="font-semibold text-slate-700">View Companies</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/dashboard/candidates"
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg shadow-sm">
                    <Users className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="font-semibold text-slate-700">Candidate Pool</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/dashboard/reports"
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg shadow-sm">
                    <TrendingUp className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="font-semibold text-slate-700">Analytics</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-2 gap-6"
      >
        {/* Left Column: Funnel + Follow-ups */}
        <div className="space-y-4">
          <motion.div variants={cardVariants}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Requirements Funnel</h3>
              <FunnelChart data={requirementsFunnel} title="" />
            </div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl transition-shadow duration-300">
              <FollowUpList followUps={urgentFollowUps} title="Urgent Follow-ups" maxItems={8} viewAllHref="/dashboard/activities" />
            </div>
          </motion.div>
        </div>

        {/* Right Column: Performance + Recent Activity */}
        <div className="space-y-4">
          <motion.div variants={cardVariants}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/dashboard/reports" className="block p-5 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-200/60 hover:shadow-lg transition-shadow hover:scale-[1.02] duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-brand-700" />
                    <span className="text-sm font-semibold text-brand-700">Conversion Rate</span>
                  </div>
                  <p className="text-4xl font-bold text-brand-900 tabular-nums">{kpis.conversionRate}%</p>
                  <p className="text-xs text-brand-600 mt-2 font-medium">Overall Pipeline</p>
                </Link>

                <Link href="/dashboard/requirements?status=ACTIVE" className="block p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/60 hover:shadow-lg transition-shadow hover:scale-[1.02] duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-indigo-700" />
                    <span className="text-sm font-semibold text-indigo-700">Active Pipeline</span>
                  </div>
                  <p className="text-4xl font-bold text-indigo-900 tabular-nums">{kpis.activeRequirements}</p>
                  <p className="text-xs text-indigo-600 mt-2 font-medium">Requirements in progress</p>
                </Link>

                <Link href="/dashboard/leads" className="block p-5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/60 hover:shadow-lg transition-shadow hover:scale-[1.02] duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">Pending Today</span>
                  </div>
                  <p className="text-4xl font-bold text-amber-900 tabular-nums">{kpis.followUpsToday}</p>
                  <p className="text-xs text-amber-600 mt-2 font-medium">Follow-ups scheduled</p>
                </Link>

                <Link href="/dashboard/requirements?status=AWAITING_JD" className="block p-5 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/60 hover:shadow-lg transition-shadow hover:scale-[1.02] duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="h-5 w-5 text-rose-700" />
                    <span className="text-sm font-semibold text-rose-700">Action Items</span>
                  </div>
                  <p className="text-4xl font-bold text-rose-900 tabular-nums">{kpis.pendingActions}</p>
                  <p className="text-xs text-rose-600 mt-2 font-medium">Awaiting your input</p>
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl transition-shadow duration-300">
              <ActivityTable activities={recentActivities} title="Recent Activity" showUser maxItems={10} viewAllHref="/dashboard/activities" />
            </div>
          </motion.div>

          {/* Audit Logs (Admin Only) */}
          {metrics.auditLogs && metrics.auditLogs.length > 0 && (
            <motion.div variants={cardVariants}>
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">System Logs</h3>
                  <Link href="/dashboard/settings" className="text-xs font-medium text-brand-600 hover:text-brand-700">View All</Link>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                  {metrics.auditLogs.map((log) => (
                    <div key={log._id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 min-w-[6px] h-1.5 rounded-full bg-slate-300" />
                      <div>
                        <p className="text-slate-900 font-medium">
                          <span className="text-slate-500 font-normal">{log.userName}</span> {log.action.toLowerCase().replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}


        </div>
      </motion.div>
      <div className="h-4" />
    </div>
  )
}
