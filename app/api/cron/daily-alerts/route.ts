import { NextResponse } from 'next/server'
import { runDailyAlerts } from '@/lib/automation/cron/dailyAlerts'

// This endpoint can be triggered by:
// 1. Vercel Cron (add to vercel.json)
// 2. External cron service (e.g., cron-job.org)
// 3. Manual trigger for testing

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow local development without secret
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    await runDailyAlerts()
    return NextResponse.json({
      success: true,
      message: 'Daily alerts processed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Daily alerts cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process daily alerts' },
      { status: 500 }
    )
  }
}

// POST also supported for webhook triggers
export async function POST(request: Request) {
  return GET(request)
}
