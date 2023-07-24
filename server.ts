import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import redisClient from './models/redis'
import { infoLogger, errorLogger } from './utils/winston'
import { logger } from './middleware/logger'

const app: Express = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(logger)

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
        await mongoose.connect(process.env.MONGO_URI as string)

        await redisClient.connect()

        // Set admin announcement
        await redisClient.set('announcement', '¡Bienvenido a EducaHub!')

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
