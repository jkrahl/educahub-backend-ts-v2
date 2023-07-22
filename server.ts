import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import { infoLogger, errorLogger } from './winston'
import { logger } from './middleware/logger'

const app: Express = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(logger)

import authRouter from './routes/auth'
import subjectsRouter from './routes/subjects'
import postsRouter from './routes/posts'
app.use('/auth', authRouter)
app.use('/subjects', subjectsRouter)
app.use('/posts', postsRouter)
;(async () => {
    console.log('Starting server...')
    const port = process.env.PORT || 3000
    try {
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
