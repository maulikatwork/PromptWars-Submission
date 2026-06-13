import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { connectDatabase } from './db/mongoose'
import './cache/redis'
import healthRouter from './routes/health'
import usersRouter from './routes/users'

const app = express()

app.use(express.json({ limit: '10kb' }))
app.use(cors({ origin: 'http://localhost:5173' }))

app.use('/api', healthRouter)
app.use('/api', usersRouter)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'))
  })
}

async function start() {
  await connectDatabase()
  const port = Number(process.env.PORT) || 3001
  app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`))
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
