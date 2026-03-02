import mongoose, { Schema, Model } from 'mongoose'

export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type ExportFormat = 'CSV' | 'JSON' | 'XLSX'

export interface IExportJob {
  _id?: mongoose.Types.ObjectId
  entityType: string
  format: ExportFormat
  status: ExportStatus
  fileUrl?: string | null
  requestedBy: mongoose.Types.ObjectId
  filter?: Record<string, unknown>
  errorMessage?: string | null
  startedAt?: Date | null
  completedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

const ExportJobSchema = new Schema<IExportJob>(
  {
    entityType: { type: String, required: true },
    format: { type: String, required: true, enum: ['CSV', 'JSON', 'XLSX'] },
    status: { type: String, required: true, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    fileUrl: { type: String },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filter: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

ExportJobSchema.index({ entityType: 1, status: 1 })
ExportJobSchema.index({ requestedBy: 1 })

const ExportJob: Model<IExportJob> = mongoose.models.ExportJob || mongoose.model<IExportJob>('ExportJob', ExportJobSchema)

export default ExportJob
