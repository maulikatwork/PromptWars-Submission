import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
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

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
)

app.use(express.json({ limit: '10kb' }))
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (origin, callback) => {
            const allowedOrigin = process.env.ALLOWED_ORIGIN

            if (!allowedOrigin) {
              callback(null, false)
              return
            }

            if (!origin || origin === allowedOrigin) {
              callback(null, true)
              return
            }

            callback(null, false)
          }
        : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-User-ID'],
  }),
)

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
