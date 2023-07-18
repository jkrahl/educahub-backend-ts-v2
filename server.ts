import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import { infoLogger, errorLogger } from './winston'
import { logger } from './middleware/logger'

dotenv.config()

const app: Express = express()

app.use(express.json())
app.use(logger)

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})
;(async () => {
    const port = process.env.PORT || 3000
    try {
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
