'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Building2,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  MinusCircle,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Users,
  Briefcase,
  Globe2,
  Sparkles,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import Button, { IconButton } from '@/components/ui/Button'
import { SearchInput, Select } from '@/components/ui/Input'
import { Modal, ConfirmDialog, Drawer } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { PageContainer } from '@/components/ui/PageContainer'

import { AnimatedButton } from '@/components/ui/AnimatedButton'
import {
  getCompanies,
  createCompanyAction,
  updateCompanyAction,
  deleteCompany,
} from '@/lib/actions/module3-company'
import { DocumentManager } from '@/components/ui/DocumentManager'
import { createExportJobAction } from '@/lib/actions/module15-export'

// Stable skeleton placeholder IDs
const SKELETON_IDS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'] as const

interface Contact {
  _id: string
  name: string
  email?: string
  phone?: string
  linkedIn?: string
  designation?: string
  isPrimary?: boolean
}

type MouStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SIGNED'

interface Company {
  _id: string
  name: string
  category: string
  sector: string
  location: string
  mouStatus: MouStatus
  website?: string
  contacts: Contact[]
  activeRequirements: number
  createdAt: Date | string
  hiringType: 'PERMANENT' | 'INTERNSHIP' | 'CONTRACT'
  source: 'SCRAPING' | 'LEAD' | 'EVENT' | 'REFERRAL'
  mouDocumentUrl?: string
  mouStartDate?: Date | string | null
  mouEndDate?: Date | string | null
  commercialPercent?: number | null
  paymentTerms?: string
  assignedCoordinatorId: string
}

const statusConfig = {
  SIGNED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    label: 'MOU Signed',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'In Progress',
  },
  NOT_STARTED: {
    bg: 'bg-stone-100 text-stone-600 border-stone-200',
    icon: MinusCircle,
    label: 'Not Started',
  },
}

const sectorOptions = [
  { value: 'IT', label: 'IT' },
  { value: 'NON_IT', label: 'Non-IT' },
  { value: 'CORE', label: 'Core' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

const hiringTypeOptions = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
]

const sourceOptions = [
  { value: 'SCRAPING', label: 'Scraping' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'EVENT', label: 'Event' },
  { value: 'REFERRAL', label: 'Referral' },
]

const getInitial = (value?: string) => (value?.trim()?.charAt(0) || '?')

const mouOptions: { value: MouStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'SIGNED', label: 'Signed' },
]

function StatusBadge({ status }: Readonly<{ status: Company['mouStatus'] }>) {
  const config = statusConfig[status] || statusConfig.NOT_STARTED
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', config.bg)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}

function CompanyCard({ company, onView, onEdit, onDelete, canEdit, canDelete }: Readonly<{ company: Company; onView: () => void; onEdit: () => void; onDelete: () => void; canEdit: boolean; canDelete: boolean }>) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20 rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-violet-500/30 dark:hover:border-violet-500/30">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="avatar avatar-lg avatar-gradient" title={company.name}>
            {getInitial(company.name)}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {company.name}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)]">{company.category}</p>
          </div>
        </div>
        <div className="relative">
          <IconButton aria-label="More options" variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal className="w-4 h-4" />
          </IconButton>
          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default bg-transparent border-0"
                onClick={() => setMenuOpen(false)}
                onKeyDown={(e) => e.key === 'Escape' && setMenuOpen(false)}
                aria-label="Close menu"
              />
              <div className="absolute right-0 top-full mt-1 z-20 dropdown-menu">
                <button onClick={() => { onView(); setMenuOpen(false) }} className="dropdown-item w-full">
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                {canEdit && (
                  <button onClick={() => { onEdit(); setMenuOpen(false) }} className="dropdown-item w-full">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <>
                    <div className="dropdown-separator" />
                    <button onClick={() => { onDelete(); setMenuOpen(false) }} className="dropdown-item dropdown-item-danger w-full">
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

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <StatusBadge status={company.mouStatus} />
        <span className="chip chip-outline text-xs">{company.sector}</span>
        <span className="chip chip-outline text-xs">{company.hiringType}</span>
        <span className="chip chip-outline text-xs">{company.source}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-4">
        <MapPin className="w-4 h-4" />
        {company.location}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[var(--surface-hover)] rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[var(--primary)] mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-lg font-bold tabular-nums">{company.activeRequirements}</span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">Active Reqs</p>
        </div>
        <div className="bg-[var(--surface-hover)] rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-lg font-bold tabular-nums">{company.contacts?.length || 0}</span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">Contacts</p>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
          HR Contacts ({company.contacts?.length || 0})
        </p>
        <div className="avatar-group">
          {(company.contacts || []).slice(0, 3).map((contact) => (
            <div
              key={contact._id}
              className="avatar avatar-sm bg-[var(--surface-hover)] text-[var(--foreground-muted)] border-2 border-white"
              title={contact.name}
            >
              {getInitial(contact.name)}
            </div>
          ))}
          {(company.contacts?.length || 0) > 3 && (
            <div className="avatar avatar-sm bg-[var(--primary-light)] text-[var(--primary)] border-2 border-white text-xs">
              +{company.contacts.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CompaniesPage() {
  const toast = useToast()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const role = session?.user?.role
  const canCreate = (['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role as any)) || role === 'COORDINATOR'
  const canEdit = canCreate
  const canDeleteCompany = (['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role as any))
  const canViewSensitive = role !== 'RECRUITER'
  const initialStatus = searchParams.get('status') || 'all'
  const showExpiringDefault = searchParams.get('mou') === 'expiring'
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(initialStatus)
  const [filterSector, setFilterSector] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [showExpiringOnly, setShowExpiringOnly] = useState<boolean>(showExpiringDefault)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const addContactRow = () => {
    setFormState((s) => ({
      ...s,
      hrContacts: [
        ...s.hrContacts,
        { name: '', email: '', phone: '', linkedIn: '', designation: '', isPrimary: false },
      ],
    }))
  }

  const updateContactField = (index: number, key: keyof CompanyFormState['hrContacts'][number], value: string | boolean) => {
    setFormState((s) => {
      const next = [...s.hrContacts]
      next[index] = { ...next[index], [key]: value }
      return { ...s, hrContacts: next }
    })
  }

  const removeContactRow = (index: number) => {
    setFormState((s) => {
      let next = s.hrContacts.filter((_, i) => i !== index)
      if (!next.length) {
        next = [{ name: '', email: '', phone: '', linkedIn: '', designation: '', isPrimary: true }]
      } else if (!next.some((c) => c.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true }
      }
      return { ...s, hrContacts: next }
    })
  }

  const setPrimaryContact = (index: number) => {
    setFormState((s) => {
      const next = s.hrContacts.map((contact, i) => ({ ...contact, isPrimary: i === index }))
      return { ...s, hrContacts: next }
    })
  }

  interface CompanyFormState {
    name: string
    category: string
    sector: string
    location: string
    mouStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'SIGNED'
    website: string
    hiringType: 'PERMANENT' | 'INTERNSHIP' | 'CONTRACT'
    source: 'SCRAPING' | 'LEAD' | 'EVENT' | 'REFERRAL'
    assignedCoordinatorId: string
    mouDocumentUrl: string
    paymentTerms: string
    hrContacts: Array<{
      _id?: string
      name: string
      phone?: string
      email?: string
      linkedIn?: string
      designation?: string
      isPrimary?: boolean
    }>
  }

  const [formState, setFormState] = useState<CompanyFormState>({
    name: '',
    category: '',
    sector: 'IT',
    location: '',
    mouStatus: 'NOT_STARTED',
    website: '',
    hiringType: 'PERMANENT',
    source: 'SCRAPING',
    assignedCoordinatorId: 'system',
    mouDocumentUrl: '',
    paymentTerms: '',
    hrContacts: [
      {
        name: '',
        email: '',
        phone: '',
        linkedIn: '',
        designation: '',
        isPrimary: true,
      },
    ],
  })

  // Fetch companies on mount
  const fetchCompanies = async () => {
    setIsLoading(true)
    const result = await getCompanies({})
    if (result.success && result.data) {
      // Transform backend data to match frontend interface
      const transformed = result.data.map((c: any) => ({
        _id: c._id,
        name: c.name,
        category: c.category || '',
        sector: c.sector,
        location: c.location,
        mouStatus: c.mouStatus,
        website: c.website,
        contacts: c.contacts || [],
        activeRequirements: c.activeRequirements || 0,
        createdAt: c.createdAt,
        hiringType: c.hiringType,
        source: c.source,
        mouDocumentUrl: c.mouDocumentUrl || '',
        mouStartDate: c.mouStartDate || null,
        mouEndDate: c.mouEndDate || null,
        commercialPercent: c.commercialPercent ?? null,
        paymentTerms: c.paymentTerms || '',
        assignedCoordinatorId: c.assignedCoordinatorId || '',
      }))
      setCompanies(transformed)
    } else {
      toast.error('Failed to load companies', result.error || 'Unknown error')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const sectors = useMemo(() => {
    const unique = new Set<string>(sectorOptions.map((s) => s.value))
    companies.forEach((c) => unique.add(c.sector))
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [companies])

  const filteredCompanies = useMemo(() => {
    let result = [...companies]

    if (showExpiringOnly) {
      const threshold = new Date()
      threshold.setDate(threshold.getDate() + 7)
      result = result.filter((c) => {
        if (!c.mouEndDate) return false
        const end = new Date(c.mouEndDate)
        return end <= threshold
      })
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    }

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.mouStatus === filterStatus)
    }

    if (filterSector !== 'all') {
      result = result.filter((c) => c.sector === filterSector)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'requirements':
          return b.activeRequirements - a.activeRequirements
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return result
  }, [companies, searchQuery, filterStatus, filterSector, sortBy, showExpiringOnly])

  const stats = useMemo(() => ({
    total: companies.length,
    signed: companies.filter((c) => c.mouStatus === 'SIGNED').length,
    inProgress: companies.filter((c) => c.mouStatus === 'IN_PROGRESS').length,
    activeReqs: companies.reduce((acc, c) => acc + c.activeRequirements, 0),
  }), [companies])

  const resetForm = () => {
    setFormState({
      name: '',
      category: '',
      sector: 'IT',
      location: '',
      mouStatus: 'NOT_STARTED',
      website: '',
      hiringType: 'PERMANENT',
      source: 'SCRAPING',
      assignedCoordinatorId: 'system',
      mouDocumentUrl: '',
      paymentTerms: '',
      hrContacts: [
        { name: '', email: '', phone: '', linkedIn: '', designation: '', isPrimary: true },
      ],
    })
    setEditingId(null)
  }

  const openAddModal = () => {
    if (!canCreate) {
      toast.error('Forbidden', 'Only admins or coordinators can add companies')
      return
    }
    resetForm()
    setIsAddModalOpen(true)
  }

  const openEditModal = (company: Company) => {
    if (!canEdit) {
      toast.error('Forbidden', 'You do not have permission to edit companies')
      return
    }
    setFormState({
      name: company.name,
      category: company.category,
      sector: company.sector,
      location: company.location,
      mouStatus: company.mouStatus,
      website: company.website || '',
      hiringType: company.hiringType,
      source: company.source,
      assignedCoordinatorId: company.assignedCoordinatorId || '',
      mouDocumentUrl: company.mouDocumentUrl || '',
      paymentTerms: company.paymentTerms || '',
      hrContacts:
        (company.contacts && company.contacts.length
          ? company.contacts.map((c) => ({
            _id: c._id,
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            linkedIn: c.linkedIn || '',
            designation: c.designation || '',
            isPrimary: c.isPrimary || false,
          }))
          : [{ name: '', email: '', phone: '', linkedIn: '', designation: '', isPrimary: true }]),
    })
    setEditingId(company._id)
    setIsAddModalOpen(true)
  }

  const handleSave = async () => {
    if (editingId && !canEdit) {
      toast.error('Forbidden', 'You do not have permission to update companies')
      return
    }
    if (!editingId && !canCreate) {
      toast.error('Forbidden', 'You do not have permission to create companies')
      return
    }

    if (!formState.name.trim()) {
      toast.error('Missing name', 'Company name is required')
      return
    }
    if (!formState.category.trim()) {
      toast.error('Missing category', 'Category is required')
      return
    }
    if (!formState.location.trim()) {
      toast.error('Missing location', 'Location is required')
      return
    }
    if (!formState.assignedCoordinatorId.trim()) {
      toast.error('Missing coordinator', 'Assigned coordinator is required')
      return
    }
    if (formState.mouStatus === 'SIGNED' && !formState.mouDocumentUrl.trim()) {
      toast.error('MOU document required', 'Provide MOU document URL when status is Signed')
      return
    }

    const preparedContacts = formState.hrContacts
      .map((c) => ({
        name: c.name.trim(),
        email: (c.email || '').trim(),
        phone: (c.phone || '').trim(),
        linkedIn: (c.linkedIn || '').trim(),
        designation: (c.designation || '').trim(),
        isPrimary: Boolean(c.isPrimary),
      }))
      .filter((c) => c.name)

    if (!preparedContacts.length) {
      toast.error('Contact required', 'Add at least one HR contact name')
      return
    }

    const hasPrimary = preparedContacts.some((c) => c.isPrimary)
    if (!hasPrimary) {
      toast.error('Primary contact required', 'Mark one HR contact as primary')
      return
    }

    const incompleteContact = preparedContacts.find((c) => !c.phone && !c.email)
    if (incompleteContact) {
      toast.error('Contact info missing', 'Each HR contact needs a phone or email')
      return
    }

    setIsSaving(true)

    if (editingId) {
      const result = await updateCompanyAction({
        id: editingId,
        name: formState.name,
        category: formState.category,
        sector: formState.sector as 'IT' | 'NON_IT' | 'CORE' | 'STARTUP' | 'ENTERPRISE',
        location: formState.location,
        mouStatus: formState.mouStatus,
        website: formState.website || undefined,
        hiringType: formState.hiringType,
        source: formState.source,
        assignedCoordinatorId: formState.assignedCoordinatorId,
        mouDocumentUrl: formState.mouDocumentUrl || undefined,
        paymentTerms: formState.paymentTerms || undefined,
        hrContacts: preparedContacts,
      })

      if (result.success) {
        toast.success('Company Updated', `${formState.name} updated successfully`)
        fetchCompanies() // Refresh list
      } else {
        toast.error('Update Failed', result.error || 'Unknown error')
      }
    } else {
      const result = await createCompanyAction({
        name: formState.name,
        category: formState.category,
        sector: formState.sector as 'IT' | 'NON_IT' | 'CORE' | 'STARTUP' | 'ENTERPRISE',
        location: formState.location,
        mouStatus: formState.mouStatus,
        website: formState.website || undefined,
        hiringType: formState.hiringType,
        source: formState.source,
        assignedCoordinatorId: formState.assignedCoordinatorId,
        mouDocumentUrl: formState.mouDocumentUrl || undefined,
        paymentTerms: formState.paymentTerms || undefined,
        hrContacts: preparedContacts,
      })

      if (result.success) {
        toast.success('Company Created', `${formState.name} added successfully`)
        fetchCompanies() // Refresh list
      } else {
        toast.error('Creation Failed', result.error || 'Unknown error')
      }
    }

    setIsSaving(false)
    setIsAddModalOpen(false)
    resetForm()
  }

  const handleDelete = (company: Company) => {
    if (!canDeleteCompany) {
      toast.error('Forbidden', 'Only admins can delete companies')
      return
    }
    setSelectedCompany(company)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!canDeleteCompany) {
      toast.error('Forbidden', 'Only admins can delete companies')
      setIsDeleteDialogOpen(false)
      return
    }
    if (selectedCompany) {
      const result = await deleteCompany(selectedCompany._id)
      if (result.success) {
        setCompanies((prev) => prev.filter((c) => c._id !== selectedCompany._id))
        toast.success('Company Deleted', `${selectedCompany.name} has been removed`)
      } else {
        toast.error('Delete Failed', result.error || 'Unknown error')
      }
      const fetchResult = await getCompanies({})
      if (fetchResult.success) {
        fetchCompanies()
      }
      setSelectedCompany(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleExport = async () => {
    const res = await createExportJobAction({
      entityType: 'COMPANY',
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
    <PageContainer
      maxWidth="7xl"
      header={
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Companies</h1>
              <p className="text-[var(--foreground-muted)]">Manage your client companies and contacts</p>
            </div>
          </div>
          {canCreate && (
            <div className="flex gap-2">
              <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
                Export
              </Button>
              <AnimatedButton variant="primary" icon={<Plus className="w-4 h-4" />} iconPosition="left" onClick={openAddModal}>
                Add Company
              </AnimatedButton>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 dark:bg-slate-800/60">
            <p className="text-sm text-[var(--foreground-muted)]">Total Companies</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{stats.total}</p>
          </div>
          <div className="p-4 rounded-2xl backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 bg-emerald-50/50 dark:bg-emerald-900/20">
            <p className="text-sm text-[var(--foreground-muted)]">MOU Signed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.signed}</p>
          </div>
          <div className="p-4 rounded-2xl backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 bg-amber-50/50 dark:bg-amber-900/20">
            <p className="text-sm text-[var(--foreground-muted)]">MOU In Progress</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="p-4 rounded-2xl backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 bg-purple-50/50 dark:bg-purple-900/20">
            <p className="text-sm text-[var(--foreground-muted)]">Active Requirements</p>
            <p className="text-2xl font-bold text-[var(--accent)] mt-1">{stats.activeReqs}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
              <SearchInput
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                className="sm:w-64"
              />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'SIGNED', label: 'MOU Signed' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'NOT_STARTED', label: 'Not Started' },
                ]}
                className="sm:w-40"
              />
              <Select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                options={[{ value: 'all', label: 'All Sectors' }, ...sectors.map((s) => ({ value: s, label: s }))]}
                className="sm:w-40"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'requirements', label: 'Sort by Requirements' },
                ]}
                className="w-44"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--foreground-muted)]">
            Showing <span className="font-semibold text-[var(--foreground)]">{filteredCompanies.length}</span> of {companies.length} companies
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {SKELETON_IDS.map((id) => (
              <div key={id} className="h-72 rounded-2xl bg-[var(--surface-hover)] animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                onView={() => {
                  setSelectedCompany(company)
                  setIsViewDrawerOpen(true)
                }}
                onEdit={() => openEditModal(company)}
                onDelete={() => handleDelete(company)}
                canEdit={canEdit}
                canDelete={canDeleteCompany}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredCompanies.length === 0 && (
          <div className="empty-state bg-white dark:bg-slate-900 rounded-2xl border border-[var(--border)]">
            <div className="empty-state-icon">
              <Building2 />
            </div>
            <h3 className="empty-state-title">No companies found</h3>
            <p className="empty-state-description">
              {searchQuery || filterStatus !== 'all' || filterSector !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Get started by adding your first company'}
            </p>
            {canCreate && !searchQuery && filterStatus === 'all' && filterSector === 'all' && (
              <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
                Add Company
              </Button>
            )}
          </div>
        )}

        <Drawer isOpen={isViewDrawerOpen} onClose={() => setIsViewDrawerOpen(false)} title={selectedCompany?.name} size="lg">
          {selectedCompany && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[var(--border)]">
                <div className="avatar avatar-xl avatar-gradient">{getInitial(selectedCompany.name)}</div>
                <div>
                  <p className="text-xs font-mono text-[var(--foreground-muted)] mb-1">{selectedCompany.category}</p>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">{selectedCompany.name}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <StatusBadge status={selectedCompany.mouStatus} />
                    <span className="chip chip-outline text-xs">{selectedCompany.sector}</span>
                    {selectedCompany.website && (
                      <a className="chip chip-outline text-xs" href={selectedCompany.website} target="_blank" rel="noreferrer">
                        <Globe2 className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats & Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-premium p-4">
                  <p className="text-sm text-[var(--foreground-muted)]">Active Reqs</p>
                  <p className="text-2xl font-bold">{selectedCompany.activeRequirements}</p>
                </div>
                <div className="card-premium p-4">
                  <p className="text-sm text-[var(--foreground-muted)]">Total Contacts</p>
                  <p className="text-2xl font-bold">{selectedCompany.contacts.length}</p>
                </div>
              </div>

              {/* Document Manager */}
              <div className="card-premium p-4">
                <DocumentManager entityType="Company" entityId={selectedCompany._id} readonly={!canEdit} />
              </div>




              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="section-header">Location</h4>
                  <div className="flex items-center gap-2 text-[var(--foreground)]">
                    <MapPin className="w-4 h-4 text-[var(--foreground-muted)]" />
                    {selectedCompany.location}
                  </div>
                </div>
                <div>
                  <h4 className="section-header">Active Requirements</h4>
                  <p className="font-semibold text-[var(--foreground)]">{selectedCompany.activeRequirements}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="section-header">Hiring Type</h4>
                  <p className="font-semibold text-[var(--foreground)]">{selectedCompany.hiringType}</p>
                </div>
                <div>
                  <h4 className="section-header">Source</h4>
                  <p className="font-semibold text-[var(--foreground)]">{selectedCompany.source}</p>
                </div>
                <div>
                  <h4 className="section-header">Assigned Coordinator</h4>
                  <p className="font-semibold text-[var(--foreground)]">{selectedCompany.assignedCoordinatorId}</p>
                </div>
                <div>
                  <h4 className="section-header">MOU</h4>
                  {canViewSensitive ? (
                    <>
                      {selectedCompany.mouDocumentUrl ? (
                        <a
                          href={selectedCompany.mouDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--primary)] text-sm underline"
                        >
                          View MOU
                        </a>
                      ) : (
                        <p className="text-sm text-[var(--foreground-muted)]">No document uploaded</p>
                      )}
                      {selectedCompany.paymentTerms && (
                        <p className="text-xs text-[var(--foreground-muted)] mt-1 whitespace-pre-line">
                          {selectedCompany.paymentTerms}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[var(--foreground-muted)]">MOU details are restricted for recruiters</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="section-header">HR Contacts ({selectedCompany.contacts?.length || 0})</h4>
                <div className="space-y-3">
                  {(selectedCompany.contacts || []).map((contact) => (
                    <div key={contact._id} className="bg-[var(--surface-hover)] rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="avatar avatar-md bg-white text-[var(--primary)] border border-[var(--border)]">
                          {getInitial(contact.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">{contact.name}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{contact.designation}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pl-12">
                        {canViewSensitive ? (
                          <>
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)]">
                              <Mail className="w-4 h-4" />
                              {contact.email}
                            </a>
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)]">
                              <Phone className="w-4 h-4" />
                              {contact.phone}
                            </a>
                          </>
                        ) : (
                          <p className="text-sm text-[var(--foreground-muted)]">Contact details hidden for recruiters</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selectedCompany.contacts || selectedCompany.contacts.length === 0) && (
                    <p className="text-sm text-[var(--foreground-muted)] italic">No contacts added yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                {canEdit && (
                  <Button variant="gradient" fullWidth leftIcon={<Edit2 className="w-4 h-4" />} onClick={() => openEditModal(selectedCompany)}>
                    Edit Company
                  </Button>
                )}
                <Button variant="secondary" fullWidth leftIcon={<Briefcase className="w-4 h-4" />}>
                  View Requirements
                </Button>
              </div>
            </div>
          )}
        </Drawer>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Company"
          message={`Are you sure you want to delete "${selectedCompany?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />

        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingId ? 'Edit Company' : 'Add New Company'}
          description={editingId ? 'Update company details' : 'Enter the details for the new client company'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="company-name" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">
                  Company Name *
                </label>
                <input
                  id="company-name"
                  className="input-modern"
                  placeholder="e.g., Acme Corporation"
                  value={formState.name}
                  onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Category *</label>
                <input
                  id="category"
                  className="input-modern"
                  placeholder="e.g., Technology, Healthcare"
                  value={formState.category}
                  onChange={(e) => setFormState((s) => ({ ...s, category: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="sector" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Sector</label>
                <select
                  id="sector"
                  className="select-modern w-full"
                  value={formState.sector}
                  onChange={(e) => setFormState((s) => ({ ...s, sector: e.target.value }))}
                >
                  {sectorOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="mou-status" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">MOU Status</label>
                <select
                  id="mou-status"
                  className="select-modern w-full"
                  value={formState.mouStatus}
                  onChange={(e) => setFormState((s) => ({ ...s, mouStatus: e.target.value as 'NOT_STARTED' | 'IN_PROGRESS' | 'SIGNED' }))}
                >
                  {mouOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Location *</label>
                <input
                  id="location"
                  className="input-modern"
                  placeholder="e.g., San Francisco, CA"
                  value={formState.location}
                  onChange={(e) => setFormState((s) => ({ ...s, location: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Website</label>
                <input
                  id="website"
                  className="input-modern"
                  placeholder="https://company.com"
                  value={formState.website}
                  onChange={(e) => setFormState((s) => ({ ...s, website: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hiring-type" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Hiring Type *</label>
                <select
                  id="hiring-type"
                  className="select-modern w-full"
                  value={formState.hiringType}
                  onChange={(e) => setFormState((s) => ({ ...s, hiringType: e.target.value as CompanyFormState['hiringType'] }))}
                >
                  {hiringTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="source" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Source *</label>
                <select
                  id="source"
                  className="select-modern w-full"
                  value={formState.source}
                  onChange={(e) => setFormState((s) => ({ ...s, source: e.target.value as CompanyFormState['source'] }))}
                >
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assigned-coordinator" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Assigned Coordinator *</label>
                <input
                  id="assigned-coordinator"
                  className="input-modern"
                  placeholder="Coordinator user ID"
                  value={formState.assignedCoordinatorId}
                  onChange={(e) => setFormState((s) => ({ ...s, assignedCoordinatorId: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="mou-document" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">MOU Document URL</label>
                <input
                  id="mou-document"
                  className="input-modern"
                  placeholder="https://..."
                  value={formState.mouDocumentUrl}
                  onChange={(e) => setFormState((s) => ({ ...s, mouDocumentUrl: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="payment-terms" className="block text-sm font-semibold text-[var(--foreground-muted)] mb-1.5">Payment Terms</label>
                <textarea
                  id="payment-terms"
                  className="input-modern min-h-[72px]"
                  placeholder="Add payment terms or notes"
                  value={formState.paymentTerms}
                  onChange={(e) => setFormState((s) => ({ ...s, paymentTerms: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">HR Contacts *</h4>
                <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={addContactRow}>
                  Add Contact
                </Button>
              </div>
              <div className="space-y-3">
                {formState.hrContacts.map((contact, index) => (
                  <div key={index} className="border border-[var(--border)] rounded-xl p-3 bg-[var(--surface-hover)]">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold text-[var(--foreground-muted)]">Contact {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                          <input
                            type="radio"
                            name="primary-contact"
                            checked={Boolean(contact.isPrimary)}
                            onChange={() => setPrimaryContact(index)}
                          />
                          Primary
                        </label>
                        {formState.hrContacts.length > 1 && (
                          <IconButton aria-label="Remove contact" variant="ghost" size="sm" onClick={() => removeContactRow(index)}>
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Name *</label>
                        <input
                          className="input-modern"
                          value={contact.name}
                          onChange={(e) => updateContactField(index, 'name', e.target.value)}
                          placeholder="Contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Designation</label>
                        <input
                          className="input-modern"
                          value={contact.designation || ''}
                          onChange={(e) => updateContactField(index, 'designation', e.target.value)}
                          placeholder="HR Manager"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Email</label>
                        <input
                          className="input-modern"
                          type="email"
                          value={contact.email || ''}
                          onChange={(e) => updateContactField(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Phone</label>
                        <input
                          className="input-modern"
                          value={contact.phone || ''}
                          onChange={(e) => updateContactField(index, 'phone', e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">LinkedIn</label>
                        <input
                          className="input-modern"
                          value={contact.linkedIn || ''}
                          onChange={(e) => updateContactField(index, 'linkedIn', e.target.value)}
                          placeholder="https://www.linkedin.com/in/..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <AnimatedButton variant="secondary" onClick={() => { setIsAddModalOpen(false); resetForm() }}>
                Cancel
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                icon={<Sparkles className="w-4 h-4" />}
                iconPosition="left"
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
              >
                {editingId ? 'Save Changes' : 'Create Company'}
              </AnimatedButton>
            </div>
          </div>
        </Modal>
      </div >
    </PageContainer >
  );
}
