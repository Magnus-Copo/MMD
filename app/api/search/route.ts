import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Company from '@/lib/db/models/Company'
import Requirement from '@/lib/db/models/Requirement'
import Candidate from '@/lib/db/models/Candidate'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  await connectDB()

  const regex = new RegExp(query, 'i')
  const results: {
    id: string
    type: 'company' | 'requirement' | 'candidate'
    title: string
    subtitle: string
    href: string
  }[] = []

  // Search companies
  const companies = await Company.find({
    deletedAt: null,
    $or: [{ name: regex }, { sector: regex }],
  })
    .limit(5)
    .lean()

  companies.forEach((c) => {
    results.push({
      id: c._id.toString(),
      type: 'company',
      title: c.name,
      subtitle: c.sector || 'Company',
      href: `/dashboard/companies/${c._id}`,
    })
  })

  // Search requirements
  const requirements = await Requirement.find({
    deletedAt: null,
    $or: [{ mmdId: regex }, { jobTitle: regex }],
  })
    .limit(5)
    .lean()

  for (const r of requirements) {
    const company = await Company.findById(r.companyId).lean()
    results.push({
      id: r._id.toString(),
      type: 'requirement',
      title: `${r.mmdId} - ${r.jobTitle}`,
      subtitle: company?.name || 'Unknown Company',
      href: `/dashboard/requirements?view=${encodeURIComponent(r._id.toString())}`,
    })
  }

  // Search candidates
  const candidates = await Candidate.find({
    deletedAt: null,
    $or: [{ name: regex }, { email: regex }],
  })
    .limit(5)
    .lean()

  for (const c of candidates) {
    const requirement = await Requirement.findById(c.requirementId).lean()
    results.push({
      id: c._id.toString(),
      type: 'candidate',
      title: c.name,
      subtitle: requirement?.mmdId || c.email,
      href: `/dashboard/candidates/${c._id}`,
    })
  }

  return NextResponse.json({ results: results.slice(0, 15) })
}
