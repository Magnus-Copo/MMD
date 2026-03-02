'use client'

import { useMemo, useState } from 'react'
import {
  Calendar,
  Mail,
  MoreVertical,
  Phone,
  Users,
  Edit,
  Trash2,
  Activity,
  ArrowUpRight,
  AlertCircle,
  Bell,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Lead, LeadStatus, LeadFilters } from '@/types/leads'
import { STATUS_CONFIG } from '@/types/leads'

interface LeadsTableProps {
  readonly leads: Lead[]
  readonly filters: LeadFilters
  readonly selectedLeads: string[]
  readonly onSelectLead: (leadId: string) => void
  readonly onSelectAll: () => void
  readonly onViewLead: (lead: Lead) => void
  readonly onEditLead: (lead: Lead) => void
  readonly onDeleteLead: (leadId: string) => void
  readonly onLogActivity: (lead: Lead) => void
  readonly onConvertLead: (lead: Lead) => void
  readonly onQuickCall: (phone: string) => void
  readonly onQuickEmail: (email: string) => void
  readonly canModify: (lead: Lead) => boolean
  readonly canConvert: boolean
  readonly canDelete: boolean
  readonly loading?: boolean
}

type SortField = 'companyName' | 'confidenceScore' | 'status' | 'followUpDate' | 'assignedToName'
type SortDir = 'asc' | 'desc' | null

// ── Status colour map ────────────────────────────────────────────────────
const STATUS_STYLE: Record<LeadStatus, { dot: string; pill: string; text: string }> = {
  NEW: { dot: 'bg-blue-500', pill: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  CONTACTED: { dot: 'bg-sky-500', pill: 'bg-sky-50 border-sky-200', text: 'text-sky-700' },
  QUALIFIED: { dot: 'bg-violet-500', pill: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
  FOLLOW_UP: { dot: 'bg-amber-500', pill: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  CONVERTED: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  REJECTED: { dot: 'bg-red-500', pill: 'bg-red-50 border-red-200', text: 'text-red-700' },
  STALLED: { dot: 'bg-gray-400', pill: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
}

// ── Confidence colour helper ─────────────────────────────────────────────
const confStyle = (score: number) => {
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700' }
  if (score >= 60) return { bar: 'bg-amber-400', text: 'text-amber-700' }
  return { bar: 'bg-red-400', text: 'text-red-600' }
}

// ── Sort icon ────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
  if (dir === 'asc') return <ChevronUp className="w-3 h-3 text-indigo-600" />
  return <ChevronDown className="w-3 h-3 text-indigo-600" />
}

export function LeadsTable({
  leads,
  filters,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onViewLead,
  onEditLead,
  onDeleteLead,
  onLogActivity,
  onConvertLead,
  onQuickCall,
  onQuickEmail,
  canModify,
  canConvert,
  canDelete,
  loading = false,
}: LeadsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortField(null); setSortDir(null) }
    } else {
      setSortField(field); setSortDir('asc')
    }
  }

  // ── Filter + sort ────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    let rows = leads.filter((lead) => {
      const q = filters.search.toLowerCase()
      const matchSearch = !q ||
        lead.companyName.toLowerCase().includes(q) ||
        lead.contactName?.toLowerCase().includes(q) ||
        lead.sector.toLowerCase().includes(q) ||
        lead.sourcePlatform.toLowerCase().includes(q)

      return matchSearch
        && (filters.status === 'all' || lead.status === filters.status)
        && (filters.sector === 'all' || lead.sector === filters.sector)
        && (filters.source === 'all' || lead.sourcePlatform === filters.source)
        && (!filters.showOverdueOnly || lead.isOverdue)
    })

    if (sortField && sortDir) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[sortField as keyof Lead] ?? '')
        const bv = String(b[sortField as keyof Lead] ?? '')
        const c = av.localeCompare(bv, undefined, { numeric: true })
        return sortDir === 'asc' ? c : -c
      })
    }
    return rows
  }, [leads, filters, sortField, sortDir])

  const selCount = useMemo(() => filteredLeads.filter(l => selectedLeads.includes(l._id)).length, [filteredLeads, selectedLeads])
  const allSel = filteredLeads.length > 0 && selCount === filteredLeads.length
  const someSel = selCount > 0 && !allSel

  // ── Column header helper ─────────────────────────────────────────────
  const Th = ({ field, label, right }: { field: SortField; label: string; right?: boolean }) => (
    <th
      onClick={() => toggleSort(field)}
      className={cn(
        'cursor-pointer select-none whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide transition-colors',
        'text-slate-500 hover:text-slate-800',
        sortField === field && 'text-indigo-600',
        right && 'text-right',
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </span>
    </th>
  )

  // ── Skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <th key={i} className="px-3 py-3">
                  <div className="h-3 w-14 animate-pulse rounded bg-slate-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-3 py-3">
                    <div className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${50 + (j * 7) % 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (filteredLeads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <AlertCircle className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-600">No leads found</p>
        <p className="text-xs text-slate-400">Try adjusting your filters</p>
      </div>
    )
  }

  // ── Table ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden w-full">

      {/* Meta bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="text-xs text-slate-500">
          <span className="font-bold text-slate-800">{filteredLeads.length}</span>
          {' '}{filteredLeads.length === 1 ? 'lead' : 'leads'}
          {selCount > 0 && (
            <span className="ml-2 rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {selCount} selected
            </span>
          )}
        </span>
        <span className="text-[11px] text-slate-400">Click headers to sort</span>
      </div>

      {/* Table — no overflow-x-auto so it never scrolls horizontally */}
      <table className="w-full table-fixed border-collapse text-sm">

        {/* ── THEAD ── */}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">

            {/* Checkbox — fixed 36px */}
            <th className="w-9 px-3 py-3">
              <input
                type="checkbox"
                title="Select all"
                aria-label="Select all leads"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                checked={allSel}
                ref={(el) => { if (el) el.indeterminate = someSel }}
                onChange={onSelectAll}
              />
            </th>

            {/* Company — widest column */}
            <Th field="companyName" label="Company" />

            {/* Contact */}
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
              Contact
            </th>

            {/* Source */}
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
              Source
            </th>

            {/* Score */}
            <Th field="confidenceScore" label="Score" />

            {/* Status */}
            <Th field="status" label="Status" />

            {/* Follow-up */}
            <Th field="followUpDate" label="Follow-up" />

            {/* Owner */}
            <Th field="assignedToName" label="Owner" />

            {/* Actions — fixed 90px */}
            <th className="w-[90px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        {/* ── TBODY ── */}
        <tbody className="divide-y divide-slate-100">
          {filteredLeads.map((lead, idx) => {
            const ss = STATUS_STYLE[lead.status] ?? STATUS_STYLE['NEW']
            const cs = confStyle(lead.confidenceScore)
            const isSel = selectedLeads.includes(lead._id)

            return (
              <tr
                key={lead._id}
                className={cn(
                  'group transition-colors duration-75',
                  isSel ? 'bg-indigo-50/70 hover:bg-indigo-50' :
                    lead.isOverdue ? 'bg-amber-50/50 hover:bg-amber-50/80' :
                      idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' :
                        'bg-slate-50/40 hover:bg-slate-50/80',
                )}
              >
                {/* ── Checkbox ── */}
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    title={`Select ${lead.companyName}`}
                    aria-label={`Select lead ${lead.companyName}`}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    checked={isSel}
                    onChange={() => onSelectLead(lead._id)}
                  />
                </td>

                {/* ── Company + sector ── */}
                <td className="px-3 py-2.5 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {lead.isOverdue && (
                      <Bell className="w-3 h-3 text-amber-500 flex-shrink-0 animate-pulse" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 leading-tight">
                        {lead.companyName}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">{lead.sector}</p>
                    </div>
                  </div>
                </td>

                {/* ── Contact + quick actions ── */}
                <td className="px-3 py-2.5 overflow-hidden">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-700 leading-tight">
                      {lead.contactName || <span className="italic text-slate-400">TBD</span>}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {lead.contactPhone && (
                        <button
                          onClick={() => onQuickCall(lead.contactPhone!)}
                          title={lead.contactPhone}
                          className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                        >
                          <Phone className="w-2.5 h-2.5" />Call
                        </button>
                      )}
                      {lead.contactEmail && (
                        <button
                          onClick={() => onQuickEmail(lead.contactEmail!)}
                          title={lead.contactEmail}
                          className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all"
                        >
                          <Mail className="w-2.5 h-2.5" />Mail
                        </button>
                      )}
                    </div>
                  </div>
                </td>

                {/* ── Source ── */}
                <td className="px-3 py-2.5 overflow-hidden">
                  <p className="truncate text-xs text-slate-600">{lead.sourcePlatform}</p>
                </td>

                {/* ── Confidence score + bar ── */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className={cn('text-xs font-bold leading-none', cs.text)}>
                      {lead.confidenceScore}%
                    </span>
                    <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', cs.bar)}
                        style={{ width: `${lead.confidenceScore}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* ── Status ── */}
                <td className="px-3 py-2.5">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
                    ss.pill, ss.text,
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', ss.dot)} />
                    {STATUS_CONFIG[lead.status]?.label ?? lead.status}
                  </span>
                </td>

                {/* ── Follow-up ── */}
                <td className="px-3 py-2.5">
                  {lead.followUpDate ? (
                    <div className={cn(
                      'flex items-center gap-1 text-xs whitespace-nowrap',
                      lead.isOverdue ? 'font-semibold text-amber-700' : 'text-slate-500',
                    )}>
                      <Calendar className={cn('w-3 h-3 flex-shrink-0', lead.isOverdue ? 'text-amber-500' : 'text-slate-400')} />
                      {lead.followUpDate}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>

                {/* ── Owner ── */}
                <td className="px-3 py-2.5 overflow-hidden">
                  {lead.assignedToName || lead.assignedTo ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                        {(lead.assignedToName || lead.assignedTo || '?')[0].toUpperCase()}
                      </div>
                      <span className="truncate text-xs text-slate-700">
                        {lead.assignedToName || lead.assignedTo}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-40">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400">—</span>
                    </div>
                  )}
                </td>

                {/* ── Actions ── */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">

                    {/* View icon button */}
                    <button
                      onClick={() => onViewLead(lead)}
                      title="View lead"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* More actions */}
                    <div className="relative group/menu">
                      <button
                        title="More actions"
                        aria-label="More actions"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 shadow-sm"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown */}
                      <div className="invisible absolute right-0 top-full z-50 mt-1 w-48 origin-top-right scale-95 rounded-xl border border-slate-200 bg-white py-1 opacity-0 shadow-xl ring-1 ring-slate-900/5 transition-all duration-100 group-hover/menu:visible group-hover/menu:scale-100 group-hover/menu:opacity-100">

                        {canModify(lead) && (
                          <button
                            onClick={() => onEditLead(lead)}
                            className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            Edit Lead
                          </button>
                        )}

                        <button
                          onClick={() => onLogActivity(lead)}
                          className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          Log Activity
                        </button>

                        {lead.status !== 'CONVERTED' && canConvert && (
                          <>
                            <div className="my-1 h-px bg-slate-100" />
                            <button
                              onClick={() => onConvertLead(lead)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              Convert to Company
                            </button>
                          </>
                        )}

                        {canModify(lead) && canDelete && (
                          <>
                            <div className="my-1 h-px bg-slate-100" />
                            <button
                              onClick={() => onDeleteLead(lead._id)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Lead
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="text-[11px] text-slate-400">
          Showing{' '}
          <span className="font-semibold text-slate-600">{filteredLeads.length}</span>
          {' '}of{' '}
          <span className="font-semibold text-slate-600">{leads.length}</span>
          {' '}leads
        </span>
        {selCount > 0 && (
          <span className="text-[11px] font-medium text-indigo-600">
            {selCount} lead{selCount > 1 ? 's' : ''} selected
          </span>
        )}
      </div>
    </div>
  )
}
