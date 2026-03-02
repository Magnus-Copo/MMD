'use client'

import { useState, useTransition, useMemo } from 'react'
import { format } from 'date-fns'
import { generateReportAction } from '@/lib/actions/module12-reporting'
import InteractiveButton from '@/components/ui/InteractiveButton'
import {
  BarChart3,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
  Download,
  Play,
  Calendar,
  Filter,
  FileSpreadsheet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ReportType = 'dailyActivity' | 'requirementStatus' | 'candidatePipeline' | 'timesheet' | 'sourceConversion'

const reportTypes: { type: ReportType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: 'dailyActivity',
    label: 'Daily Activity',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Track user activities and interactions',
  },
  {
    type: 'requirementStatus',
    label: 'Requirement Status',
    icon: <Briefcase className="h-5 w-5" />,
    description: 'View requirements by status and aging',
  },
  {
    type: 'candidatePipeline',
    label: 'Candidate Pipeline',
    icon: <Users className="h-5 w-5" />,
    description: 'Funnel analysis and conversion rates',
  },
  {
    type: 'timesheet',
    label: 'Timesheet',
    icon: <Clock className="h-5 w-5" />,
    description: 'Hours logged by user and requirement',
  },
  {
    type: 'sourceConversion',
    label: 'Source Conversion',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Lead sources and conversion metrics',
  },
]

const presets = [
  { label: 'Today', from: () => new Date(), to: () => new Date() },
  {
    label: 'This Week',
    from: () => {
      const d = new Date()
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(d.setDate(diff))
    },
    to: () => new Date(),
  },
  {
    label: 'This Month',
    from: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: () => new Date(),
  },
  {
    label: 'Last 30 Days',
    from: () => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d
    },
    to: () => new Date(),
  },
]

export default function ReportBuilder() {
  const [reportType, setReportType] = useState<ReportType>('dailyActivity')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [activityType, setActivityType] = useState('')
  const [status, setStatus] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [userId, setUserId] = useState('')
  const [data, setData] = useState<unknown>(null)
  const [csvUrl, setCsvUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Reset filters when report type changes
  useMemo(() => {
    setActivityType('')
    setStatus('')
    setCompanyId('')
    setUserId('')
    setData(null)
    setCsvUrl(null)
    setError(null)
  }, [reportType])

  const previewRows = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data.slice(0, 20)
    if ((data as { funnel?: unknown[] }).funnel) return (data as { funnel: unknown[] }).funnel
    return []
  }, [data])

  const headers = useMemo(() => {
    if (!previewRows.length) return []
    return Object.keys(previewRows[0] as Record<string, unknown>)
  }, [previewRows])

  const run = (formatType: 'view' | 'csv') => {
    setError(null)
    startTransition(async () => {
      const res = await generateReportAction({
        type: reportType,
        format: formatType,
        filters: {
          from: from || undefined,
          to: to || undefined,
          activityType: activityType || undefined,
          status: status || undefined,
          companyId: companyId || undefined,
          userId: userId || undefined,
        },
      })
      if (!res.success) {
        setError(res.error || 'Failed to generate report')
        return
      }
      if (formatType === 'csv' && (res as any).csv) {
        const blob = new Blob([(res as any).csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        setCsvUrl(url)
      } else {
        setData(res.data)
        setCsvUrl(null)
      }
    })
  }

  const renderCell = (value: unknown) => {
    if (value === null || value === undefined) return '-'
    if (value instanceof Date) return format(value, 'MMM d, yyyy')
    if (typeof value === 'object') return JSON.stringify(value)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
    return '-'
  }

  const selectedReport = reportTypes.find((r) => r.type === reportType)

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Report Type Selector */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {reportTypes.map((r) => (
            <button
              key={r.type}
              onClick={() => setReportType(r.type)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all card-interactive bg-white',
                reportType === r.type
                  ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20 shadow-sm'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]'
              )}
            >
              <div className={cn('mb-2 icon-bounce', reportType === r.type ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]')}>
                {r.icon}
              </div>
              <p className="font-medium text-[var(--foreground)] text-sm">{r.label}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">{r.description}</p>
            </button>
          ))}

        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-[var(--foreground-muted)]" />
          <h3 className="font-medium text-[var(--foreground)]">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1" htmlFor="fromDate">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
              <input
                id="fromDate"
                type="date"
                className="input-modern pl-10"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1" htmlFor="toDate">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
              <input
                id="toDate"
                type="date"
                className="input-modern pl-10"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* Conditional Filters */}
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1" htmlFor="userId">
              User ID (optional)
            </label>
            <input
              id="userId"
              type="text"
              placeholder="Filter by user"
              className="input-modern"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          {reportType === 'dailyActivity' && (
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1" htmlFor="activityType">
                Activity Type
              </label>
              <select
                id="activityType"
                className="select-modern w-full"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="NOTE">Note</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
          )}

          {reportType === 'requirementStatus' && (
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="select-modern w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="AWAITING_JD">Awaiting JD</option>
                <option value="ACTIVE">Active</option>
                <option value="SOURCING">Sourcing</option>
                <option value="INTERVIEWING">Interviewing</option>
                <option value="OFFERED">Offered</option>
                <option value="CLOSED">Closed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          )}

          {reportType === 'candidatePipeline' && (
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1" htmlFor="companyId">
                Company ID
              </label>
              <input
                id="companyId"
                type="text"
                placeholder="Filter by company"
                className="input-modern"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
          <span className="text-sm text-[var(--foreground-muted)] mr-2">Quick Select:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(format(p.from(), 'yyyy-MM-dd'))
                setTo(format(p.to(), 'yyyy-MM-dd'))
              }}
              className="px-3 py-1 text-sm bg-[var(--surface-hover)] hover:bg-[var(--surface-active)] text-[var(--foreground)] rounded-lg transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <InteractiveButton
          onClick={() => run('view')}
          disabled={isPending}
          isLoading={isPending}
          loadingText="Generating..."
          variant="primary"
          size="md"
        >
          <Play className="h-4 w-4" />
          Generate Report
        </InteractiveButton>

        <InteractiveButton
          onClick={() => run('csv')}
          disabled={isPending}
          isLoading={isPending}
          variant="secondary"
          size="md"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV
        </InteractiveButton>

        {csvUrl && (
          <a
            href={csvUrl}
            download={`${reportType}-${format(new Date(), 'yyyyMMdd')}.csv`}
            className="btn-accent inline-flex items-center justify-center h-10 px-4 text-sm gap-2 bg-indigo-600 text-white rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
          {error}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{selectedReport?.label} Report</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              {previewRows.length > 0 ? `Showing ${previewRows.length} rows` : 'No data yet'}
            </p>
          </div>
          {previewRows.length > 0 && (
            <button
              onClick={() => globalThis.print()}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              Print Report
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface)]">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium text-[var(--foreground-muted)] border-b border-[var(--border)] whitespace-nowrap"
                  >
                    {h.replaceAll(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row: Record<string, unknown>, idx: number) => (
                <tr
                  key={typeof row._id === 'string' ? row._id : `row-${idx}`}
                  className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {headers.map((h) => (
                    <td key={`${h}-${idx}`} className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">
                      {renderCell(row[h])}
                    </td>
                  ))}
                </tr>
              ))}
              {!previewRows.length && (
                <tr>
                  <td className="px-4 py-12 text-center text-[var(--foreground-muted)]" colSpan={headers.length || 1}>
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-[var(--foreground-subtle)]" />
                    <p>No data to display</p>
                    <p className="text-sm mt-1">Select filters and click &quot;Generate Report&quot;</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
