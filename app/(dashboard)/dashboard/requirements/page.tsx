'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  Briefcase,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  MapPin,
  DollarSign,
  Users,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Send,
  Building2,
  Target,
  Download,
  Calendar,
  AlertCircle,
  Archive,
  ArrowUpRight,
  Filter,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Button, { IconButton } from '@/components/ui/Button'
import { SearchInput, Select } from '@/components/ui/Input'
import { Modal, ConfirmDialog, Drawer } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { getRequirements, createRequirement, updateRequirement, deleteRequirement, freezeRequirement, reassignRequirement } from '@/lib/actions/requirements'
import { AutomationPanel } from '@/components/automation/AutomationPanel'
import { createExportJobAction } from '@/lib/actions/module15-export'

// Stable skeleton placeholder IDs
const SKELETON_IDS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'] as const

// Types
interface Requirement {
  id: string
  mmdId: string
  title: string
  company: string
  companyId: string
  location: string
  locationType: string
  status: string
  priority: string
  owner: string
  budget: string
  openings: number
  filledPositions: number
  submissions: number
  interviews: number
  skills: string[]
  createdAt: string
  deadline?: string
  description?: string
  lastActivityAt?: string
  stalled?: boolean
}

// Status Configuration
const statusConfig: Record<string, { bg: string; icon: any; color: string }> = {
  // Title Case (Legacy/Frontend)
  Active: {
    bg: 'bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-900/20 dark:border-emerald-700/30',
    color: 'text-emerald-700 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  'On Hold': {
    bg: 'bg-amber-50/50 border-amber-200/50 dark:bg-amber-900/20 dark:border-amber-700/30',
    color: 'text-amber-700 dark:text-amber-400',
    icon: Pause,
  },
  Filled: {
    bg: 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-900/20 dark:border-blue-700/30',
    color: 'text-blue-700 dark:text-blue-400',
    icon: Users,
  },
  Closed: {
    bg: 'bg-slate-50/50 border-slate-200/50 dark:bg-slate-800/20 dark:border-slate-700/30',
    color: 'text-slate-600 dark:text-slate-400',
    icon: Archive,
  },
  Cancelled: {
    bg: 'bg-red-50/50 border-red-200/50 dark:bg-red-900/20 dark:border-red-700/30',
    color: 'text-red-700 dark:text-red-400',
    icon: XCircle,
  },
  // UPPERCASE (DB)
  ACTIVE: {
    bg: 'bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-900/20 dark:border-emerald-700/30',
    color: 'text-emerald-700 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  ON_HOLD: {
    bg: 'bg-amber-50/50 border-amber-200/50 dark:bg-amber-900/20 dark:border-amber-700/30',
    color: 'text-amber-700 dark:text-amber-400',
    icon: Pause,
  },
  FILLED: {
    bg: 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-900/20 dark:border-blue-700/30',
    color: 'text-blue-700 dark:text-blue-400',
    icon: Users,
  },
  CLOSED_HIRED: {
    bg: 'bg-slate-50/50 border-slate-200/50 dark:bg-slate-800/20 dark:border-slate-700/30',
    color: 'text-slate-600 dark:text-slate-400',
    icon: Archive,
  },
  CLOSED_NOT_HIRED: {
    bg: 'bg-slate-50/50 border-slate-200/50 dark:bg-slate-800/20 dark:border-slate-700/30',
    color: 'text-slate-600 dark:text-slate-400',
    icon: XCircle,
  },
  PENDING_INTAKE: {
    bg: 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-900/20 dark:border-blue-700/30',
    color: 'text-blue-700 dark:text-blue-400',
    icon: Clock,
  },
  SOURCING: {
    bg: 'bg-indigo-50/50 border-indigo-200/50 dark:bg-indigo-900/20 dark:border-indigo-700/30',
    color: 'text-indigo-700 dark:text-indigo-400',
    icon: Users,
  },
  INTERVIEWING: {
    bg: 'bg-violet-50/50 border-violet-200/50 dark:bg-violet-900/20 dark:border-violet-700/30',
    color: 'text-violet-700 dark:text-violet-400',
    icon: Users,
  },
  OFFER: {
    bg: 'bg-teal-50/50 border-teal-200/50 dark:bg-teal-900/20 dark:border-teal-700/30',
    color: 'text-teal-700 dark:text-teal-400',
    icon: CheckCircle2,
  },
  // Default/Fallback
  default: {
    bg: 'bg-slate-50/50 border-slate-200/50 dark:bg-slate-800/20 dark:border-slate-700/30',
    color: 'text-slate-700 dark:text-slate-400',
    icon: Clock,
  }
}

const priorityConfig: Record<string, string> = {
  High: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  Low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  default: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
}

const locationTypeConfig: Record<string, string> = {
  Remote: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
  Hybrid: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  'On-site': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const config = statusConfig[status] || statusConfig.default
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm', config.bg, config.color)}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}

function PriorityBadge({ priority }: Readonly<{ priority: Requirement['priority'] }>) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm', priorityConfig[priority] || priorityConfig.default)}>
      <Target className="w-3 h-3" />
      {priority}
    </span>
  )
}

// Requirement Card Component
function RequirementCard({
  requirement,
  onView,
  onEdit,
  onDelete,
  onFreeze,
  onReassign,
  canEdit,
  canDelete,
  canFreeze,
  canReassign,
  hideFinancials = false,
}: Readonly<{
  requirement: Requirement
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onFreeze?: () => void
  onReassign?: () => void
  canEdit: boolean
  canDelete: boolean
  canFreeze?: boolean
  canReassign?: boolean
  hideFinancials?: boolean
}>) {
  const [menuOpen, setMenuOpen] = useState(false)
  const fillPercentage = requirement.openings > 0
    ? Math.round((requirement.filledPositions / requirement.openings) * 100)
    : 0

  const lastActivityDate = requirement.lastActivityAt ? new Date(requirement.lastActivityAt) : null
  const daysSinceActivity = lastActivityDate
    ? Math.max(0, Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-violet-500/30 dark:hover:border-violet-500/30">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 px-2 py-0.5 rounded-full font-medium tracking-wide">
              {requirement.mmdId}
            </span>
            <PriorityBadge priority={requirement.priority} />
            {requirement.stalled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
                <AlertCircle className="w-3 h-3" />
                Stalled {daysSinceActivity !== null ? `(${daysSinceActivity}d)` : ''}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
            {requirement.title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
            <Building2 className="w-3.5 h-3.5" />
            <span className="font-medium">{requirement.company}</span>
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <IconButton
            aria-label="More options"
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md"
          >
            <MoreHorizontal className="w-4 h-4" />
          </IconButton>
          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 w-full h-full cursor-default border-none bg-transparent"
                onClick={() => setMenuOpen(false)}
                tabIndex={-1}
                aria-label="Close menu"
                type="button"
              />
              <div className="absolute right-0 top-full mt-2 w-48 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => { onView(); setMenuOpen(false) }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  View Details
                </button>
                {canEdit && (
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                    Edit
                  </button>
                )}
                <button onClick={() => setMenuOpen(false)} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <Send className="w-4 h-4 text-slate-500" />
                  Add Submission
                </button>
                {canFreeze && (
                  <button onClick={() => { onFreeze?.(); setMenuOpen(false) }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <Pause className="w-4 h-4 text-slate-500" />
                    Put On Hold
                  </button>
                )}
                {canReassign && (
                  <button onClick={() => { onReassign?.(); setMenuOpen(false) }} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <Users className="w-4 h-4 text-slate-500" />
                    Reassign Owner
                  </button>
                )}
                {canDelete && (
                  <>
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-1 mx-2" />
                    <button
                      onClick={() => { onDelete(); setMenuOpen(false) }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <MapPin className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs uppercase tracking-wide font-semibold">Location</span>
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={requirement.location}>{requirement.location}</p>
        </div>
        {!hideFinancials && (
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs uppercase tracking-wide font-semibold">Budget</span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{requirement.budget || 'N/A'}</p>
          </div>
        )}
      </div>

      {/* Status & Deadline Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <StatusBadge status={requirement.status} />
        <div className="flex items-center gap-1.5">
          <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium border backdrop-blur-sm', locationTypeConfig[requirement.locationType] || locationTypeConfig.default)}>
            {requirement.locationType}
          </span>
          {requirement.deadline && (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {new Date(requirement.deadline).toLocaleDateString('en-US')}
            </span>
          )}
        </div>
      </div>


      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Filling Progress</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {requirement.filledPositions} <span className="text-slate-400 font-normal">/ {requirement.openings}</span>
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out shadow-sm',
              fillPercentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
            )}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700/50">
          <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">{requirement.submissions}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Submissions</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700/50">
          <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400 tabular-nums">{requirement.interviews}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Interviews</p>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {requirement.skills.slice(0, 3).map((skill) => (
          <span key={skill} className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{skill}</span>
        ))}
        {requirement.skills.length > 3 && (
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">+{requirement.skills.length - 3}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
            {requirement.owner.charAt(0)}
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {requirement.owner}
          </span>
        </div>
        <button onClick={onView} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 group/btn">
          View Details <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}

// Requirement Drawer with Automation Panel
function RequirementDrawer({
  requirement,
  isOpen,
  onClose,
}: {
  requirement: Requirement | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!requirement) return null

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={requirement.title} size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-mono text-xl font-bold shadow-lg shadow-indigo-500/20">
            {requirement.mmdId.split('-').pop()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{requirement.mmdId}</span>
              <PriorityBadge priority={requirement.priority} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{requirement.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium">
                <Building2 className="w-4 h-4" />
                {requirement.company}
              </div>
              <StatusBadge status={requirement.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-violet-500" />
                Description
              </h3>
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                {requirement.description || 'No description provided.'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {requirement.skills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-slate-200 dark:border-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Automation & Meta */}
          <div className="space-y-6">
            {/* Automation Panel Integration */}
            <div className="space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                AI Automation
              </h3>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <AutomationPanel
                  requirementId={requirement.id}
                  content={{}}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Location</label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {requirement.location}
                  <span className="text-slate-400 text-sm font-normal">({requirement.locationType})</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Budget</label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  {requirement.budget || 'Not specified'}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Deadline</label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {requirement.deadline ? new Date(requirement.deadline).toLocaleDateString('en-US') : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

// Main Page Component
export default function RequirementsPage() {
  const toast = useToast()
  const { data: session, status: sessionStatus } = useSession()
  const role = session?.user?.role
  const canCreate = (['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role as any)) || role === 'COORDINATOR'
  const canEdit = canCreate
  const canDelete = (['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role as any))
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>(searchParams.get('priority') || 'all')
  const [sortBy, setSortBy] = useState<string>('recent')

  // Modal States
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [requirements, setRequirements] = useState<Requirement[]>([]) // Start empty, fetch real data
  const [isLoading, setIsLoading] = useState(true)

  // Fetch Data
  const fetchData = async () => {
    if (sessionStatus !== 'authenticated') return

    setIsLoading(true)
    const res = await getRequirements({
      status: filterStatus !== 'all' && filterStatus !== 'STALLED' && filterStatus !== 'AWAITING_JD' ? filterStatus : undefined,
      stalled: filterStatus === 'STALLED' ? true : undefined,
    })
    if (res.success) {
      setRequirements(res.data)
    } else {
      toast.error('Error', res.error || 'Failed to fetch requirements')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchData()
    }
  }, [filterStatus, sessionStatus])

  const [formState, setFormState] = useState({
    title: '',
    mmdId: '',
    company: '',
    companyId: '',
    location: '',
    locationType: 'Remote',
    status: 'ACTIVE',
    priority: 'Medium',
    owner: '',
    budget: '',
    openings: 1,
    filledPositions: 0,
    submissions: 0,
    interviews: 0,
    skills: '',
    deadline: '',
    description: '',
  })

  const resetForm = () => {
    setFormState({
      title: '',
      mmdId: '',
      company: '',
      companyId: '',
      location: '',
      locationType: 'Remote',
      status: 'ACTIVE', // Default to DB enum
      priority: 'Medium',
      owner: '',
      budget: '',
      openings: 1,
      filledPositions: 0,
      submissions: 0,
      interviews: 0,
      skills: '',
      deadline: '',
      description: '',
    })
    setEditingId(null)
  }

  // Filter and sort
  const filteredRequirements = useMemo(() => {
    let result = [...requirements]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.mmdId.toLowerCase().includes(query) ||
          r.company.toLowerCase().includes(query) ||
          r.skills.some((s) => s.toLowerCase().includes(query))
      )
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'AWAITING_JD') {
        result = result.filter((r) => r.status === 'ACTIVE' && (!r.description || r.description.length < 50))
      } else if (filterStatus === 'STALLED') {
        result = result.filter((r) => r.stalled)
      } else {
        result = result.filter((r) => r.status === filterStatus)
      }
    }

    if (filterPriority !== 'all') {
      result = result.filter((r) => r.priority === filterPriority)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'submissions':
          return b.submissions - a.submissions
        case 'priority': {
          const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
          const pA = priorityOrder[a.priority] ?? 99
          const pB = priorityOrder[b.priority] ?? 99
          return pA - pB
        }
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return result
  }, [searchQuery, filterStatus, filterPriority, sortBy, requirements])

  // Stats
  const stats = useMemo(() => ({
    total: requirements.length,
    active: requirements.filter((r) => r.status === 'ACTIVE').length,
    onHold: requirements.filter((r) => r.status === 'ON_HOLD').length,
    stalled: requirements.filter((r) => r.stalled).length,
    filled: requirements.filter((r) => ['CLOSED_HIRED', 'OFFER'].includes(r.status)).length,
    totalSubmissions: requirements.reduce((acc, r) => acc + r.submissions, 0),
    totalInterviews: requirements.reduce((acc, r) => acc + r.interviews, 0),
  }), [requirements])

  // Handlers
  const handleView = (requirement: Requirement) => {
    setSelectedRequirement(requirement)
    setIsViewDrawerOpen(true)
  }

  const handleEdit = (requirement: Requirement) => {
    if (!canEdit) {
      toast.error('Forbidden', 'You do not have permission to edit requirements')
      return
    }
    setFormState({
      title: requirement.title,
      mmdId: requirement.mmdId,
      company: requirement.company,
      companyId: requirement.companyId,
      location: requirement.location,
      locationType: requirement.locationType,
      status: requirement.status,
      priority: requirement.priority,
      owner: requirement.owner,
      budget: requirement.budget,
      openings: requirement.openings,
      filledPositions: requirement.filledPositions,
      submissions: requirement.submissions,
      interviews: requirement.interviews,
      skills: requirement.skills.join(', '),
      deadline: requirement.deadline || '',
      description: requirement.description || '',
    })
    setEditingId(requirement.id)
    setIsAddModalOpen(true)
  }

  const handleDelete = (requirement: Requirement) => {
    if (!canDelete) {
      toast.error('Forbidden', 'Only admins can delete requirements')
      return
    }
    setSelectedRequirement(requirement)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!canDelete) {
      toast.error('Forbidden', 'Only admins can delete requirements')
      setIsDeleteDialogOpen(false)
      return
    }
    if (selectedRequirement) {
      const res = await deleteRequirement(selectedRequirement.id)
      if (res.success) {
        setRequirements((prev) => prev.filter((r) => r.id !== selectedRequirement.id))
        toast.success('Requirement Deleted', `${selectedRequirement.mmdId} has been removed`)
        fetchData()
      } else {
        toast.error('Error', res.error || 'Failed to delete requirement')
      }
      setIsDeleteDialogOpen(false)
      setSelectedRequirement(null)
    }
  }

  const handleFreeze = async (requirement: Requirement) => {
    if (!canEdit) {
      toast.error('Forbidden', 'Only admins or coordinators can put requirements on hold')
      return
    }

    const comment = window.prompt('Add a note for putting this requirement on hold (optional)') || undefined
    const res = await freezeRequirement(requirement.id, comment)
    if (res.success) {
      setRequirements((prev) => prev.map((r) => r.id === requirement.id ? { ...r, status: 'ON_HOLD', stalled: false } : r))
      toast.success('Requirement On Hold', `${requirement.mmdId} has been moved to On Hold`)
      fetchData()
    } else {
      toast.error('Error', res.error || 'Failed to put requirement on hold')
    }
  }

  const handleReassign = async (requirement: Requirement) => {
    if (!canEdit) {
      toast.error('Forbidden', 'Only admins or coordinators can reassign requirements')
      return
    }

    const newOwnerId = window.prompt('Enter the new owner user ID')
    if (!newOwnerId || !newOwnerId.trim()) return
    const comment = window.prompt('Add a note for this reassignment (optional)') || undefined

    const res = await reassignRequirement(requirement.id, newOwnerId.trim(), comment)
    if (res.success) {
      toast.success('Requirement Reassigned', `${requirement.mmdId} reassigned successfully`)
      fetchData()
    } else {
      toast.error('Error', res.error || 'Failed to reassign requirement')
    }
  }

  const openAddModal = () => {
    if (!canCreate) {
      toast.error('Forbidden', 'Only admins or coordinators can create requirements')
      return
    }
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleSave = async () => {
    if (editingId && !canEdit) {
      toast.error('Forbidden', 'You do not have permission to update requirements')
      return
    }
    if (!editingId && !canCreate) {
      toast.error('Forbidden', 'You do not have permission to create requirements')
      return
    }

    if (!formState.title.trim()) {
      toast.error('Missing title', 'Job title is required')
      return
    }

    const skillsArray = formState.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      title: formState.title,
      mmdId: formState.mmdId,
      status: formState.status,
      priority: formState.priority,
      location: formState.location || 'Remote',
      locationType: formState.locationType,
      company: formState.company || 'Unassigned',
      companyId: formState.companyId || 'NA',
      budget: formState.budget || '',
      openings: Number(formState.openings),
      skills: skillsArray,
      description: formState.description,
      deadline: formState.deadline
    }

    if (editingId) {
      const res = await updateRequirement(editingId, payload)
      if (res.success) {
        setRequirements((prev) =>
          prev.map((r) => r.id === editingId ? { ...r, ...res.data } : r)
        )
        toast.success('Requirement Updated', 'Changes saved successfully')
        fetchData()
      } else {
        toast.error('Error', res.error || 'Failed to update requirement')
      }
    } else {
      const res = await createRequirement(payload)
      if (res.success) {
        setRequirements((prev) => [res.data, ...prev])
        toast.success('Requirement Created', 'New requirement added successfully')
      } else {
        toast.error('Error', res.error || 'Failed to create requirement')
      }
    }

    setIsAddModalOpen(false)
    resetForm()
  }

  const handleExport = async () => {
    const res = await createExportJobAction({
      entityType: 'REQUIREMENT',
      format: 'CSV',
      filter: { status: filterStatus !== 'all' ? filterStatus : undefined }
    })
    if (res.success) {
      toast.success('Export Started', 'You will be notified when it is ready')
    } else {
      toast.error('Export Failed', res.error || 'Could not start export')
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 transform group-hover:scale-105 transition-transform duration-300">
              <Briefcase className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Requirements</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage job requirements and track submissions</p>
          </div>
        </div>

        {canCreate && (
          <div className="flex gap-3">
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport} className="bg-white hover:bg-slate-50 border-slate-200">
              Export
            </Button>
            <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal} className="shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all">
              Add Requirement
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-y-4 gap-x-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-800 dark:text-white', bg: 'bg-white/60 dark:bg-slate-800/60' },
          { label: 'Active', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' },
          { label: 'On Hold', value: stats.onHold, color: 'text-amber-600', bg: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' },
          { label: 'Filled', value: stats.filled, color: 'text-blue-600', bg: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' },
          { label: 'Stalled', value: stats.stalled, color: 'text-rose-600', bg: 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30' },
          { label: 'Submissions', value: stats.totalSubmissions, color: 'text-indigo-600', bg: 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30' },
          { label: 'Interviews', value: stats.totalInterviews, color: 'text-violet-600', bg: 'bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30' },
        ].map((stat, i) => (
          <div key={i} className={cn(
            "p-4 rounded-2xl backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300",
            stat.bg
          )}>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-extrabold tracking-tight", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full md:w-auto">
          <div className="relative">
            <SearchInput
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              className="sm:w-80 shadow-sm border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 rounded-xl"
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'STALLED', label: 'Stalled (idle)' },
              { value: 'FILLED', label: 'Filled' },
              { value: 'CLOSED_HIRED', label: 'Closed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            className="sm:w-48 shadow-sm border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 rounded-xl"
          />
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
            className="sm:w-48 shadow-sm border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'recent', label: 'Most Recent' },
              { value: 'title', label: 'By Title' },
              { value: 'submissions', label: 'By Submissions' },
              { value: 'priority', label: 'By Priority' },
            ]}
            className="sm:w-48 shadow-sm border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 rounded-xl"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredRequirements.length}</span> of {requirements.length} requirements
        </p>
      </div>


      {/* Requirements Grid */}
      {(() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center p-20">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
                <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              </div>
            </div>
          )
        }

        if (filteredRequirements.length > 0) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRequirements.map((requirement) => (
                <RequirementCard
                  key={requirement.id}
                  requirement={requirement}
                  onView={() => handleView(requirement)}
                  onEdit={() => handleEdit(requirement)}
                  onDelete={() => handleDelete(requirement)}
                  onFreeze={() => handleFreeze(requirement)}
                  onReassign={() => handleReassign(requirement)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  canFreeze={canEdit && requirement.status !== 'ON_HOLD'}
                  canReassign={canEdit}
                />
              ))}
            </div>
          )
        }

        return (
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No requirements found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first requirement'}
            </p>
            {canCreate && !searchQuery && filterStatus === 'all' && filterPriority === 'all' && (
              <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
                Add Requirement
              </Button>
            )}
          </div>
        )
      })()}

      {/* View Requirement Drawer */}
      <RequirementDrawer
        requirement={selectedRequirement}
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Requirement"
        message={`Are you sure you want to delete "${selectedRequirement?.mmdId}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Add Requirement Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm() }}
        title={editingId ? 'Edit Requirement' : 'Add New Requirement'}
        description={editingId ? 'Update requirement details' : 'Create a new job requirement'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="req-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
              <input
                id="req-title"
                className="input-modern w-full"
                placeholder="e.g., Senior Software Engineer"
                value={formState.title}
                onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
              <input
                id="req-company"
                className="input-modern w-full"
                placeholder="e.g., ArcLight Systems"
                value={formState.company}
                onChange={(e) => setFormState((s) => ({ ...s, company: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <Select
                value={formState.priority}
                onChange={(e) => setFormState((s) => ({ ...s, priority: e.target.value }))}
                options={[
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="req-location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <input
                id="req-location"
                className="input-modern w-full"
                placeholder="e.g., San Francisco, CA"
                value={formState.location}
                onChange={(e) => setFormState((s) => ({ ...s, location: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-budget" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Budget Range</label>
              <input
                id="req-budget"
                className="input-modern w-full"
                placeholder="e.g., $120K - $150K"
                value={formState.budget}
                onChange={(e) => setFormState((s) => ({ ...s, budget: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-openings" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Number of Openings</label>
              <input
                id="req-openings"
                className="input-modern w-full"
                type="number"
                placeholder="1"
                min="1"
                value={formState.openings}
                onChange={(e) => setFormState((s) => ({ ...s, openings: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label htmlFor="req-deadline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
              <input
                id="req-deadline"
                className="input-modern w-full"
                type="date"
                value={formState.deadline}
                onChange={(e) => setFormState((s) => ({ ...s, deadline: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <Select
                value={formState.status}
                onChange={(e) => setFormState((s) => ({ ...s, status: e.target.value }))}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'ON_HOLD', label: 'On Hold' },
                  { value: 'FILLED', label: 'Filled' },
                  { value: 'CLOSED_HIRED', label: 'Closed' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="req-location-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location Type</label>
              <Select
                value={formState.locationType}
                onChange={(e) => setFormState((s) => ({ ...s, locationType: e.target.value }))}
                options={[
                  { value: 'Remote', label: 'Remote' },
                  { value: 'Hybrid', label: 'Hybrid' },
                  { value: 'On-site', label: 'On-site' }
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="req-owner" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Owner</label>
              <input
                id="req-owner"
                className="input-modern w-full"
                placeholder="e.g., Priya Patel"
                value={formState.owner}
                onChange={(e) => setFormState((s) => ({ ...s, owner: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-mmd" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">MMD ID</label>
              <input
                id="req-mmd"
                className="input-modern w-full"
                placeholder="MMD-R-1056"
                value={formState.mmdId}
                onChange={(e) => setFormState((s) => ({ ...s, mmdId: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-skills" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skills (comma separated)</label>
              <input
                id="req-skills"
                className="input-modern w-full"
                placeholder="React, TypeScript, GraphQL"
                value={formState.skills}
                onChange={(e) => setFormState((s) => ({ ...s, skills: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="req-submissions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Submissions</label>
              <input
                id="req-submissions"
                className="input-modern w-full"
                type="number"
                min="0"
                value={formState.submissions}
                onChange={(e) => setFormState((s) => ({ ...s, submissions: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label htmlFor="req-interviews" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interviews</label>
              <input
                id="req-interviews"
                className="input-modern w-full"
                type="number"
                min="0"
                value={formState.interviews}
                onChange={(e) => setFormState((s) => ({ ...s, interviews: Number(e.target.value) }))}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="req-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                id="req-description"
                className="input-modern w-full min-h-[100px]"
                placeholder="Brief description"
                value={formState.description}
                onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => { setIsAddModalOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Create Requirement'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
