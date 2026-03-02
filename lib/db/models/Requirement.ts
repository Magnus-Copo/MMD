import mongoose, { Schema, Model } from 'mongoose'

export type Group = 'RASHMI' | 'MANJUNATH' | 'SCRAPING' | 'LEADS'
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE'
export type RequirementStatus =
  | 'PENDING_INTAKE'
  | 'AWAITING_JD'
  | 'ACTIVE'
  | 'SOURCING'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'CLOSED_HIRED'
  | 'CLOSED_NOT_HIRED'
  | 'ON_HOLD'

export interface IRequirement {
  _id?: mongoose.Types.ObjectId
  mmdId: string
  companyId: mongoose.Types.ObjectId
  jobTitle: string
  fullDescription: string
  skills: string[]
  experienceMin: number
  experienceMax: number
  salaryMin?: number
  salaryMax?: number
  openings: number
  workMode: WorkMode
  location: string
  interviewClosingDate?: Date
  group: Group
  accountOwnerId: mongoose.Types.ObjectId
  status: RequirementStatus
  applicationFormId?: string | null
  whatsAppMessage?: string | null
  emailMessage?: string | null
  linkedInPost?: string | null
  jdEmbedding?: number[]
  deletedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

const RequirementSchema = new Schema<IRequirement>(
  {
    mmdId: { type: String, required: true, unique: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    jobTitle: { type: String, required: true },
    fullDescription: { type: String, required: true },
    skills: { type: [String], required: true },
    experienceMin: { type: Number, required: true },
    experienceMax: { type: Number, required: true },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    openings: { type: Number, default: 1 },
    workMode: { type: String, required: true, enum: ['REMOTE', 'HYBRID', 'ONSITE'] },
    location: { type: String, required: true },
    interviewClosingDate: { type: Date },
    group: { type: String, required: true, enum: ['RASHMI', 'MANJUNATH', 'SCRAPING', 'LEADS'] },
    accountOwnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      required: true,
      enum: ['PENDING_INTAKE', 'AWAITING_JD', 'ACTIVE', 'SOURCING', 'INTERVIEWING', 'OFFER', 'CLOSED_HIRED', 'CLOSED_NOT_HIRED', 'ON_HOLD'],
      default: 'PENDING_INTAKE',
    },
    applicationFormId: { type: String, unique: true, sparse: true },
    whatsAppMessage: { type: String },
    emailMessage: { type: String },
    linkedInPost: { type: String },
    jdEmbedding: { type: [Number], default: undefined },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

RequirementSchema.index({ companyId: 1 })
RequirementSchema.index({ accountOwnerId: 1 })
RequirementSchema.index({ status: 1 })
RequirementSchema.index({ group: 1 })
// mmdId index is already created via unique: true in schema
RequirementSchema.index({ deletedAt: 1 })

const Requirement: Model<IRequirement> = mongoose.models.Requirement || mongoose.model<IRequirement>('Requirement', RequirementSchema)

export default Requirement
