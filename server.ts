import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { infoLogger, errorLogger } from './utils/winston'
import { logger } from './middleware/logger'
import cors from 'cors'

const app: Express = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(logger)
app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: 'cross-origin',
        },
    })
)
app.use(
    rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 250,
    })
)
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
    })
)

import authRouter from './routes/auth'
import subjectsRouter from './routes/subjects'
import postsRouter from './routes/posts'
import indexRouter from './routes/index'
app.use('/auth', authRouter)
app.use('/subjects', subjectsRouter)
app.use('/posts', postsRouter)
app.use('/', indexRouter)
;(async () => {
    console.log('Starting server...')
    const port = process.env.PORT || 3000
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI not found')

        await mongoose.connect(process.env.MONGO_URI as string)

        app.listen(port, () => {
            infoLogger.info({
                message: `Server running at http://localhost:${port}`,
            })
        })
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })
    }
})()
