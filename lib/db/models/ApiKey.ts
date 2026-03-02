import mongoose, { Schema, Model } from 'mongoose'

export interface IApiKey {
  _id?: mongoose.Types.ObjectId
  name: string
  keyHash: string
  scopes: string[]
  createdBy: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    name: { type: String, required: true },
    keyHash: { type: String, required: true },
    scopes: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

ApiKeySchema.index({ name: 1, createdBy: 1 })

const ApiKey: Model<IApiKey> = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema)

export default ApiKey
