import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Types } from "mongoose"
import {
  AdminDashboard,
  CoordinatorDashboard,
  RecruiterDashboard,
  ScraperDashboard
} from "./_components"
// ... imports
import { getDashboardMetrics, getRecruiterDashboard } from "@/lib/actions/dashboard"
import { getEnhancedLeadMetrics } from "@/lib/actions/module9-leads"
import { AlertCircle } from "lucide-react"
import { PageTransition } from "@/components/layout/PageTransition"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role || 'RECRUITER'
  const userId = session.user.id

  try {
    // Get dashboard data based on role
    const user = {
      _id: new Types.ObjectId(userId),
      role: role as 'ADMIN' | 'COORDINATOR' | 'RECRUITER' | 'SCRAPER',
      assignedGroup: null,
    }

    const metrics = await getDashboardMetrics(user)

    if ((['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role as any))) {
      return (
        <PageTransition>
          <AdminDashboard metrics={metrics} userName={session.user.name || 'Admin'} />
        </PageTransition>
      )
    }

    if (role === 'COORDINATOR') {
      return (
        <PageTransition>
          <CoordinatorDashboard metrics={metrics} userName={session.user.name || 'Coordinator'} />
        </PageTransition>
      )
    }

    if (role === 'SCRAPER') {
      const enhancedMetricsRes = await getEnhancedLeadMetrics({})
      const enhancedMetrics = enhancedMetricsRes?.data || undefined

      return (
        <PageTransition>
          <ScraperDashboard userName={session.user.name || 'Scraper'} metrics={enhancedMetrics} />
        </PageTransition>
      )
    }

    // Recruiter dashboard
    const recruiterData = await getRecruiterDashboard(userId)
    return (
      <PageTransition>
        <RecruiterDashboard
          metrics={metrics}
          recruiterData={recruiterData}
          userName={session.user.name || 'Recruiter'}
        />
      </PageTransition>
    )
  } catch (error) {
    console.error('Dashboard error:', error)

    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Dashboard Error</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Unable to load dashboard</p>
            </div>
          </div>

          <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-4">
            <p className="text-sm text-[var(--foreground)] mb-2">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Please check:
            </p>
            <ul className="text-xs text-[var(--foreground-muted)] list-disc list-inside mt-2 space-y-1">
              <li>MongoDB is running (check service status)</li>
              <li>Database has been seeded with users (run: npm run db:seed)</li>
              <li>DATABASE_URL is correctly set in .env</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <a
              href="/login"
              className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-center text-sm font-medium"
            >
              Back to Login
            </a>
            <a
              href="/dashboard"
              className="flex-1 px-4 py-2 bg-[var(--surface-hover)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-active)] transition-colors text-sm font-medium border border-[var(--border)] text-center"
            >
              Retry
            </a>
          </div>
        </div>
      </div>
    )
  }
}
