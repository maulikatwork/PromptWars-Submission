import mongoose, { Schema, type Document } from 'mongoose'

export interface IInsight {
  userId: string
  pattern: string
  triggerLabel: string
  outcomeLabel: string
  confidence: number
  supportingCount: number
  firstObserved: Date
  lastObserved: Date
  createdAt: Date
  updatedAt: Date
}

export type IInsightDocument = IInsight & Document

const insightSchema = new Schema<IInsightDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    pattern: {
      type: String,
      required: true,
      trim: true,
    },
    triggerLabel: {
      type: String,
      required: true,
      trim: true,
    },
    outcomeLabel: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    supportingCount: {
      type: Number,
      required: true,
      min: 2,
    },
    firstObserved: {
      type: Date,
      required: true,
    },
    lastObserved: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

insightSchema.index({ userId: 1, confidence: -1 })

export const Insight = mongoose.model<IInsightDocument>('Insight', insightSchema)
