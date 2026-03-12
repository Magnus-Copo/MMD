#!/usr/bin/env node

/**
 * Phase 6.2 service-level verification suite.
 *
 * This script creates isolated test fixtures in MongoDB, verifies critical
 * service transitions/lifecycle behavior, and cleans up created records.
 *
 * Usage:
 *   npx tsx scripts/verify-phase6-services.ts
 */

import mongoose from 'mongoose'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import connectDB from '../lib/db/mongodb'
import User from '../lib/db/models/User'
import Company from '../lib/db/models/Company'
import Requirement from '../lib/db/models/Requirement'
import Candidate from '../lib/db/models/Candidate'
import Invoice from '../lib/db/models/Invoice'
import ExportJob from '../lib/db/models/ExportJob'
import ReportSchedule from '../lib/db/models/ReportSchedule'
import AuditLog from '../lib/db/models/AuditLog'
import AnalyticsEvent from '../lib/db/models/AnalyticsEvent'
import { RequirementService } from '../lib/services/requirement.service'
import { CandidateService } from '../lib/services/candidate.service'
import { InvoiceService } from '../lib/services/invoice.service'
import { ExportService } from '../lib/services/export.service'
import { ReportingService } from '../lib/services/reporting.service'

interface ContextIds {
  userIds: string[]
  companyIds: string[]
  requirementIds: string[]
  candidateIds: string[]
  invoiceIds: string[]
  exportJobIds: string[]
  reportScheduleIds: string[]
}

function loadLocalEnv(): void {
  const envPath = join(process.cwd(), '.env')
  const envRegex = /^([^=:#]+)=(.*)$/

  try {
    const envContent = readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return

      const match = envRegex.exec(trimmed)
      if (!match) return

      const key = match[1].trim()
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (!process.env[key]) {
        process.env[key] = value
      }
    })
  } catch {
    // .env is optional if env vars are already injected.
  }
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const converted = String(value)
    if (converted && converted !== '[object Object]') {
      return converted
    }
  }
  return ''
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

async function expectThrows(action: () => Promise<unknown>, contains: string): Promise<void> {
  try {
    await action()
    throw new Error(`Expected an error containing: ${contains}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes(contains)) {
      throw new Error(`Expected error containing "${contains}", got: ${message}`)
    }
  }
}

async function runTest(name: string, testFn: () => Promise<void>, counters: { passed: number; failed: number }): Promise<void> {
  try {
    await testFn()
    counters.passed += 1
    console.log(`PASS ${name}`)
  } catch (error) {
    counters.failed += 1
    const message = error instanceof Error ? error.message : String(error)
    console.error(`FAIL ${name}`)
    console.error(`  ${message}`)
  }
}

async function cleanup(ids: ContextIds): Promise<void> {
  const objectIds = ids.userIds
    .filter((id) => /^[a-fA-F0-9]{24}$/.test(id))
    .map((id) => new mongoose.Types.ObjectId(id))

  const scheduleObjectIds = ids.reportScheduleIds
    .filter((id) => /^[a-fA-F0-9]{24}$/.test(id))
    .map((id) => new mongoose.Types.ObjectId(id))

  await ReportSchedule.deleteMany({ _id: { $in: ids.reportScheduleIds } })
  await ExportJob.deleteMany({ _id: { $in: ids.exportJobIds } })
  await Invoice.deleteMany({ _id: { $in: ids.invoiceIds } })
  await Candidate.deleteMany({ _id: { $in: ids.candidateIds } })
  await Requirement.deleteMany({ _id: { $in: ids.requirementIds } })
  await Company.deleteMany({ _id: { $in: ids.companyIds } })
  await User.deleteMany({ _id: { $in: ids.userIds } })

  if (scheduleObjectIds.length > 0) {
    await AnalyticsEvent.deleteMany({
      entityType: 'ReportSchedule',
      $or: [
        { entityId: { $in: ids.reportScheduleIds } },
        { entityId: { $in: scheduleObjectIds } },
      ],
    })
  }

  if (ids.userIds.length > 0) {
    await AuditLog.deleteMany({
      $or: [
        { entityId: { $in: [...ids.requirementIds, ...ids.candidateIds, ...ids.invoiceIds, ...ids.exportJobIds, ...ids.reportScheduleIds] } },
        { userId: { $in: objectIds } },
      ],
    })
  }
}

async function main(): Promise<void> {
  loadLocalEnv()
  await connectDB()

  const counters = { passed: 0, failed: 0 }
  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const ids: ContextIds = {
    userIds: [],
    companyIds: [],
    requirementIds: [],
    candidateIds: [],
    invoiceIds: [],
    exportJobIds: [],
    reportScheduleIds: [],
  }

  let coordinatorId = ''
  let adminId = ''
  let companyId = ''
  let requirementId = ''
  let candidateId = ''
  let invoicePaidId = ''
  let invoiceOverdueId = ''
  let exportJobId = ''
  let reportScheduleId = ''

  try {
    const coordinator = await User.create({
      email: `phase6-coordinator-${runId}@example.com`,
      password: 'Phase6Test123!',
      name: `Phase6 Coordinator ${runId}`,
      role: 'COORDINATOR',
      isActive: true,
    })
    coordinatorId = coordinator._id.toString()
    ids.userIds.push(coordinatorId)

    const admin = await User.create({
      email: `phase6-admin-${runId}@example.com`,
      password: 'Phase6Test123!',
      name: `Phase6 Admin ${runId}`,
      role: 'ADMIN',
      isActive: true,
    })
    adminId = admin._id.toString()
    ids.userIds.push(adminId)

    const now = Date.now()
    const company = await Company.create({
      name: `Phase6 Company ${runId}`,
      category: 'Technology',
      sector: 'IT',
      location: `Bengaluru-${runId}`,
      hiringType: 'PERMANENT',
      source: 'LEAD',
      mouStatus: 'SIGNED',
      mouDocumentUrl: 'https://example.com/mou.pdf',
      mouStartDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
      mouEndDate: new Date(now + 365 * 24 * 60 * 60 * 1000),
      commercialPercent: 8,
      paymentTerms: 'Net 30',
      assignedCoordinatorId: coordinator._id,
    })
    companyId = company._id.toString()
    ids.companyIds.push(companyId)

    const createdRequirement = await RequirementService.create(
      { id: coordinatorId, role: 'COORDINATOR' },
      {
        companyId,
        jobTitle: 'Phase6 QA Engineer',
        fullDescription:
          'This requirement validates Phase 6 service-level transitions and data integrity checks across modules.',
        skills: ['TypeScript', 'Automation'],
        experienceMin: 2,
        experienceMax: 6,
        salaryMin: 500000,
        salaryMax: 700000,
        openings: 2,
        workMode: 'HYBRID',
        location: 'Bengaluru',
        priority: 'Medium',
        group: 'LEADS',
        accountOwnerId: coordinatorId,
        status: 'ACTIVE',
      }
    )
    requirementId = asString((createdRequirement as { _id?: unknown })._id)
    ids.requirementIds.push(requirementId)

    const createdCandidate = await CandidateService.create(
      { id: coordinatorId, role: 'COORDINATOR' },
      {
        requirementId,
        name: `Phase6 Candidate ${runId}`,
        phone: '9999999999',
        email: `phase6-candidate-${runId}@example.com`,
        skills: ['TypeScript'],
        yearsExperience: 4,
      }
    )
    candidateId = asString((createdCandidate as { _id?: unknown })._id)
    ids.candidateIds.push(candidateId)

    await runTest(
      'Requirement valid transition persists',
      async () => {
        const updated = await RequirementService.updateStatus(
          { id: coordinatorId, role: 'COORDINATOR' },
          { requirementId, status: 'SOURCING', comment: 'Started sourcing' }
        )
        assert(asString((updated as { status?: unknown }).status) === 'SOURCING', 'Requirement status should become SOURCING')

        const reloaded = await RequirementService.getById(
          { id: coordinatorId, role: 'COORDINATOR' },
          requirementId
        )
        assert(asString((reloaded as { status?: unknown }).status) === 'SOURCING', 'Requirement status should persist after reload')
      },
      counters
    )

    await runTest(
      'Requirement invalid transition is blocked',
      async () => {
        await expectThrows(
          () =>
            RequirementService.updateStatus(
              { id: coordinatorId, role: 'COORDINATOR' },
              { requirementId, status: 'CLOSED_HIRED', comment: 'Invalid direct close' }
            ),
          'Invalid transition'
        )
      },
      counters
    )

    await runTest(
      'Candidate transition validations enforce payload rules',
      async () => {
        await expectThrows(
          () =>
            CandidateService.updateStatus(
              { id: coordinatorId, role: 'COORDINATOR' },
              { candidateId, status: 'SHORTLISTED' }
            ),
          'Phone log is required'
        )

        const shortlisted = await CandidateService.updateStatus(
          { id: coordinatorId, role: 'COORDINATOR' },
          { candidateId, status: 'SHORTLISTED', phoneLog: 'Reached candidate and validated fit' }
        )
        assert(asString((shortlisted.candidate as { status?: unknown }).status) === 'SHORTLISTED', 'Candidate should be SHORTLISTED')

        await expectThrows(
          () =>
            CandidateService.updateStatus(
              { id: coordinatorId, role: 'COORDINATOR' },
              { candidateId, status: 'OFFERED' }
            ),
          'Offered CTC is required'
        )

        const offered = await CandidateService.updateStatus(
          { id: coordinatorId, role: 'COORDINATOR' },
          { candidateId, status: 'OFFERED', offeredCtc: 800000 }
        )
        assert(asString((offered.candidate as { status?: unknown }).status) === 'OFFERED', 'Candidate should be OFFERED')
        assert(Boolean(offered.warning), 'Expected a budget warning when offered CTC exceeds requirement salary max')

        await expectThrows(
          () =>
            CandidateService.updateStatus(
              { id: coordinatorId, role: 'COORDINATOR' },
              { candidateId, status: 'REJECTED' }
            ),
          'Rejection reason code is required'
        )

        const rejected = await CandidateService.updateStatus(
          { id: coordinatorId, role: 'COORDINATOR' },
          { candidateId, status: 'REJECTED', rejectionReasonCode: 'ROLE_MISMATCH' }
        )
        assert(asString((rejected.candidate as { status?: unknown }).status) === 'REJECTED', 'Candidate should be REJECTED')
      },
      counters
    )

    await runTest(
      'Invoice transitions and metrics stay consistent',
      async () => {
        const nowDate = new Date()

        await expectThrows(
          () =>
            InvoiceService.create(
              { id: coordinatorId, role: 'COORDINATOR' },
              {
                companyId,
                requirementId,
                amount: 100000,
                currency: 'INR',
                issueDate: nowDate,
                dueDate: new Date(nowDate.getTime() - 24 * 60 * 60 * 1000),
              }
            ),
          'Due date cannot be before issue date'
        )

        const paidInvoice = await InvoiceService.create(
          { id: coordinatorId, role: 'COORDINATOR' },
          {
            companyId,
            requirementId,
            amount: 120000,
            currency: 'INR',
            issueDate: nowDate,
            dueDate: new Date(nowDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          }
        )
        invoicePaidId = asString((paidInvoice as { _id?: unknown })._id)
        ids.invoiceIds.push(invoicePaidId)

        await InvoiceService.updateStatus(
          { id: coordinatorId, role: 'COORDINATOR' },
          { invoiceId: invoicePaidId, status: 'SENT' }
        )
        await InvoiceService.updateStatus(
          { id: coordinatorId, role: 'COORDINATOR' },
          { invoiceId: invoicePaidId, status: 'PAID' }
        )

        await expectThrows(
          () =>
            InvoiceService.updateStatus(
              { id: coordinatorId, role: 'COORDINATOR' },
              { invoiceId: invoicePaidId, status: 'SENT' }
            ),
          'Cannot transition from PAID to SENT'
        )

        const oldIssueDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
        const overdueInvoice = await InvoiceService.create(
          { id: coordinatorId, role: 'COORDINATOR' },
          {
            companyId,
            requirementId,
            amount: 90000,
            currency: 'INR',
            issueDate: oldIssueDate,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          }
        )
        invoiceOverdueId = asString((overdueInvoice as { _id?: unknown })._id)
        ids.invoiceIds.push(invoiceOverdueId)

        await InvoiceService.updateStatus(
          { id: coordinatorId, role: 'COORDINATOR' },
          { invoiceId: invoiceOverdueId, status: 'SENT' }
        )

        const metrics = await InvoiceService.getMetrics({ id: coordinatorId, role: 'COORDINATOR' })
        assert(metrics.countPaid >= 1, 'Metrics should report at least one paid invoice')
        assert(metrics.countOverdue >= 1, 'Metrics should report at least one overdue invoice')
      },
      counters
    )

    await runTest(
      'Export jobs process to completed with download payload',
      async () => {
        const createdJob = await ExportService.createJob(
          { id: coordinatorId, role: 'COORDINATOR' },
          {
            entityType: 'REQUIREMENT',
            format: 'CSV',
            filter: { companyId },
          }
        )
        exportJobId = asString((createdJob as { _id?: unknown })._id)
        ids.exportJobIds.push(exportJobId)

        const processSummary = await ExportService.processPendingJobs(
          { id: 'system-phase6', role: 'SYSTEM' },
          { limit: 10 }
        )
        assert(processSummary.completed >= 1, 'At least one export job should complete during processing')

        const jobs = await ExportService.listJobs(
          { id: coordinatorId, role: 'COORDINATOR' },
          { entityType: 'REQUIREMENT', limit: 10 }
        )

        const completedJob = (jobs as Array<Record<string, unknown>>).find(
          (job) => asString(job._id) === exportJobId
        )
        assert(Boolean(completedJob), 'Created export job should be present in list')
        assert(asString(completedJob?.status) === 'COMPLETED', 'Export job should be COMPLETED')

        const download = await ExportService.getDownloadPayload(
          { id: coordinatorId, role: 'COORDINATOR' },
          exportJobId
        )
        assert(Array.isArray(download.rows), 'Download payload should include rows array')
      },
      counters
    )

    await runTest(
      'Scheduled report runner executes active schedule',
      async () => {
        const createdSchedule = await ReportingService.createSchedule(
          { id: coordinatorId, role: 'COORDINATOR' },
          {
            name: `Phase6 Schedule ${runId}`,
            reportType: 'requirementStatus',
            frequency: 'DAILY',
            recipients: ['ops@example.com'],
            filters: {},
            isActive: true,
          }
        )
        reportScheduleId = asString((createdSchedule as { _id?: unknown })._id)
        ids.reportScheduleIds.push(reportScheduleId)

        const summary = await ReportingService.runScheduledReports(
          { id: 'system-phase6', role: 'SYSTEM' },
          { limit: 25 }
        )

        assert(summary.executed >= 1, 'Expected at least one schedule execution')

        const schedule = await ReportSchedule.findById(reportScheduleId).select('lastRunAt').lean()
        assert(Boolean(schedule?.lastRunAt), 'Executed schedule should have lastRunAt set')
      },
      counters
    )

    console.log('\nPhase 6.2 Verification Summary')
    console.log(`  passed: ${counters.passed}`)
    console.log(`  failed: ${counters.failed}`)

    if (counters.failed > 0) {
      process.exitCode = 1
    }
  } finally {
    await cleanup(ids)
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('Phase 6.2 verification crashed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
