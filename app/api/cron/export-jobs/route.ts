import { NextResponse } from 'next/server'
import { runExportJobs } from '@/lib/automation/cron/exportJobs'

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
  const limitParam = Number.parseInt(url.searchParams.get('limit') || '10', 10)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 25) : 10

  try {
    const summary = await runExportJobs(limit)
    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Export jobs cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process export jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
