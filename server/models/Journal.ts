import mongoose, { Schema, type Document } from 'mongoose'

export interface IJournal {
  userId: string
  rawText: string
  sentimentScore: number | null
  emotionalThemes: string[]
  triggers: string[]
  distressLevel: number
  createdAt: Date
}

export type IJournalDocument = IJournal & Document

const journalSchema = new Schema<IJournalDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    rawText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
      validate: {
        validator(value: string) {
          return value.trim().length > 0
        },
        message: 'Journal text cannot be empty',
      },
    },
    sentimentScore: {
      type: Number,
      default: null,
      min: -1,
      max: 1,
    },
    emotionalThemes: {
      type: [String],
      default: [],
    },
    triggers: {
      type: [String],
      default: [],
    },
    distressLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
)

journalSchema.index({ userId: 1, createdAt: -1 })

export const Journal = mongoose.model<IJournalDocument>('Journal', journalSchema)
