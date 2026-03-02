import connectDB from '@/lib/db/mongodb'
import Requirement from '@/lib/db/models/Requirement'
import Candidate from '@/lib/db/models/Candidate'

function cosine(a: number[], b: number[]) {
  const dot = a.reduce((acc, v, i) => acc + v * (b[i] ?? 0), 0)
  const normA = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0))
  const normB = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0))
  if (!normA || !normB) return 0
  return dot / (normA * normB)
}

export async function matchCandidateToJD(requirementId: string, limit = 10) {
  await connectDB()
  const req = await Requirement.findById(requirementId)
  if (!req?.jdEmbedding || !Array.isArray(req.jdEmbedding)) return []
  
  const jdEmbedding: number[] = req.jdEmbedding
  const candidates = await Candidate.find({ requirementId, embedding: { $exists: true } }).lean()
  
  const scored = candidates
    .filter((c) => c.embedding && Array.isArray(c.embedding))
    .map((c) => ({ 
      candidate: c, 
      score: cosine(jdEmbedding, c.embedding as number[]) 
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
  return scored
}
