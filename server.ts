import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import { infoLogger, errorLogger } from './winston'
import { logger } from './middleware/logger'
import authRouter from './routes/auth'
import mongoose from 'mongoose'

dotenv.config()

const app: Express = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(logger)

app.use('/auth', authRouter)

;(async () => {
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
