import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { connectDatabase } from './db/mongoose'
import './cache/redis'
import { errorHandler } from './middleware/errorHandler'
import healthRouter from './routes/health'
import usersRouter from './routes/users'
import journalsRouter from './routes/journals'
import insightsRouter from './routes/insights'
import chatRouter from './routes/chat'
import dashboardRouter from './routes/dashboard'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '10kb' }))
app.use(cors({ origin: 'http://localhost:5173' }))

app.use('/api', healthRouter)
app.use('/api', usersRouter)
app.use('/api', journalsRouter)
app.use('/api', insightsRouter)
app.use('/api', chatRouter)
app.use('/api/dashboard', dashboardRouter)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'))
  })
}

app.use(errorHandler)

async function start() {
  await connectDatabase()
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
