import connectDB from '@/lib/db/mongodb'
import Candidate from '@/lib/db/models/Candidate'
import Requirement from '@/lib/db/models/Requirement'
import DataAccessLog from '@/lib/db/models/DataAccessLog'

export async function softDeleteRequirement(requirementId: string, userId: string) {
  await connectDB()
  await Requirement.findByIdAndUpdate(requirementId, { deletedAt: new Date() })
  await DataAccessLog.create({ userId, entity: 'Requirement', entityId: requirementId, action: 'EXPORT' })
}

export async function restoreRequirement(requirementId: string) {
  await connectDB()
  await Requirement.findByIdAndUpdate(requirementId, { deletedAt: null })
}

export async function softDeleteCandidate(candidateId: string, userId: string) {
  await connectDB()
  await Candidate.findByIdAndUpdate(candidateId, { deletedAt: new Date() })
  await DataAccessLog.create({ userId, entity: 'Candidate', entityId: candidateId, action: 'EXPORT' })
}

export async function restoreCandidate(candidateId: string) {
  await connectDB()
  await Candidate.findByIdAndUpdate(candidateId, { deletedAt: null })
}
