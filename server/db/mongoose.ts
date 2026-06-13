import mongoose from 'mongoose'
import { DatabaseConnectionError } from './errors'

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new DatabaseConnectionError('MONGODB_URI is not configured')
  }

  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error'
    throw new DatabaseConnectionError(`Failed to connect to MongoDB: ${message}`)
  }
}

export async function pingDatabase(): Promise<boolean> {
  if (mongoose.connection.readyState !== 1) {
    return false
  }

  await mongoose.connection.db?.admin().ping()
  return true
}
