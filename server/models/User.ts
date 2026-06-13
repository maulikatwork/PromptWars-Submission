import mongoose, { Schema, type Document } from 'mongoose'
import { EXAM_OPTIONS, type ExamOption } from '../constants/exams'

export interface IUser {
  userId: string
  name: string
  exam: ExamOption
  targetDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export type IUserDocument = IUser & Document

const userSchema = new Schema<IUserDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      validate: {
        validator(value: string) {
          return value.trim().length > 0
        },
        message: 'Name cannot be empty',
      },
    },
    exam: {
      type: String,
      required: true,
      enum: EXAM_OPTIONS,
    },
    targetDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const User = mongoose.model<IUserDocument>('User', userSchema)
