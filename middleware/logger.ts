import { requestLogger } from '../winston'
import { Request, Response, NextFunction } from 'express'

export const logger = (req: Request, res: Response, next: NextFunction) => {
    requestLogger.info({
        date: new Date().toISOString(),
        method: req.method,
        path: req.path,
        body: req.body,
    })
    next()
}
