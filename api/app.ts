/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import geologyRoutes from './routes/geology.js'
import drillingRoutes from './routes/drilling.js'
import productionRoutes from './routes/production.js'
import storageRoutes from './routes/storage.js'
import equipmentRoutes from './routes/equipment.js'
import safetyRoutes from './routes/safety.js'
import systemRoutes from './routes/system.js'
import { store } from './data/store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

store.initMockData()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Powered-By', 'OilField-Management-System')
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/geology', geologyRoutes)
app.use('/api/drilling', drillingRoutes)
app.use('/api/production', productionRoutes)
app.use('/api/storage', storageRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/safety', safetyRoutes)
app.use('/api/system', systemRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
    method: req.method,
  })
})

export default app
