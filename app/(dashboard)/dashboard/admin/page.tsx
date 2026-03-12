'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Users,
  Building2,
  FileText,
  Activity,
  Clock,
  AlertTriangle,
  Archive,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAuditLogs, getAuditActions, getAuditEntities } from '@/lib/actions/module16-audit'
import { getUsers } from '@/lib/actions/module1-auth'
import { getCompanies } from '@/lib/actions/module3-company'
import { useToast } from '@/components/ui/Toast'
import { SearchInput } from '@/components/ui/Input'

interface AuditEntry {
  _id: string
  action: string
  entity: string
  entityId: string
  userId: string
  userName?: string
  createdAt: string
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalCompanies: number
  recentActions: number
}

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const toast = useToast()

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    recentActions: 0,
  })
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [actions, setActions] = useState<string[]>([])
  const [entities, setEntities] = useState<string[]>([])
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (session && session.user && !['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [session, router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, companiesRes, logsRes, actionsRes, entitiesRes] = await Promise.all([
        getUsers({}),
        getCompanies({}),
        getAuditLogs({}),
        getAuditActions({}),
        getAuditEntities({}),
      ])

      const usersList = (usersRes?.data as unknown as any[]) || []
      const companiesList = (companiesRes?.data as unknown as any[]) || []
      const logsData = logsRes?.data as unknown as any
      const logsList = Array.isArray(logsData) ? logsData : (logsData?.logs || [])

      setStats({
        totalUsers: usersList.length,
        activeUsers: usersList.filter((u: any) => u.isActive).length,
        totalCompanies: companiesList.length,
        recentActions: logsList.length,
      })

      setAuditLogs(logsList.slice(0, 20).map((l: any) => ({
        _id: l._id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        userId: l.userId,
        userName: l.userName || l.userId,
        createdAt: l.createdAt,
      })))

      setActions((actionsRes?.data as string[]) || [])
      setEntities((entitiesRes?.data as string[]) || [])
    } catch (err) {
      console.error('Admin data fetch error:', err)
      toast.error('Error', 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user && ['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      fetchData()
    }
  }, [session, fetchData])

  const fetchFilteredLogs = useCallback(async () => {
    setAuditLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (actionFilter) filters.action = actionFilter
      if (entityFilter) filters.entity = entityFilter
      const res = await getAuditLogs(filters)
      const resData = res?.data as unknown as any
      const logsList = Array.isArray(resData) ? resData : (resData?.logs || [])
      setAuditLogs(logsList.slice(0, 50).map((l: any) => ({
        _id: l._id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        userId: l.userId,
        userName: l.userName || l.userId,
        createdAt: l.createdAt,
      })))
    } catch {
      toast.error('Error', 'Failed to filter logs')
    } finally {
      setAuditLoading(false)
    }
  }, [actionFilter, entityFilter, toast])

  useEffect(() => {
    if (!loading) {
      fetchFilteredLogs()
    }
  }, [actionFilter, entityFilter, fetchFilteredLogs, loading])

  const filteredLogs = searchQuery
    ? auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : auditLogs

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600', link: '/dashboard/users' },
    { label: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'from-emerald-500 to-emerald-600', link: '/dashboard/users' },
    { label: 'Companies', value: stats.totalCompanies, icon: Building2, color: 'from-violet-500 to-violet-600', link: '/dashboard/companies' },
    { label: 'Audit Events', value: stats.recentActions, icon: FileText, color: 'from-amber-500 to-amber-600', link: '#audit' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500">System overview, audit logs, and management</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={() => card.link !== '#audit' && router.push(card.link)}
            className={cn(
              'relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 transition-shadow hover:shadow-lg',
              card.link !== '#audit' && 'cursor-pointer'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('p-2 rounded-lg bg-gradient-to-br text-white', card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
              {card.link !== '#audit' && <ChevronRight className="h-4 w-4 text-slate-400" />}
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/dashboard/users')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-left"
        >
          <Users className="h-5 w-5 text-indigo-500" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">User Management</p>
            <p className="text-xs text-slate-500">Add, edit, deactivate users</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/dashboard/integrations')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-left"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Integrations</p>
            <p className="text-xs text-slate-500">Manage connections & webhooks</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-left"
        >
          <FileText className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Reports</p>
            <p className="text-xs text-slate-500">Generate & schedule reports</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/dashboard/admin/archive')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-left"
        >
          <Archive className="h-5 w-5 text-rose-500" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Archive Management</p>
            <p className="text-xs text-slate-500">Restore soft-deleted records</p>
          </div>
        </button>
      </div>

      {/* Audit Logs */}
      <div id="audit" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Audit Log</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-48">
                <SearchInput
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">All Actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">All Entities</option>
                {entities.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
          {auditLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No audit logs found</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log._id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.entity} &bull; by {log.userName} &bull; {formatDate(log.createdAt)}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {log.entity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
