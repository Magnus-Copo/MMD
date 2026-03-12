import { NextResponse } from 'next/server'
import { runReportSchedules } from '@/lib/automation/cron/reportSchedules'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (process.env.NODE_ENV === 'production' && cronSecret) {
    return authHeader === `Bearer ${cronSecret}`
  }

  return true
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limitParam = Number.parseInt(url.searchParams.get('limit') || '25', 10)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 25

  try {
    const summary = await runReportSchedules(limit)
    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Report schedules cron error:', error)
    return NextResponse.json(
      { error: 'Failed to execute report schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
