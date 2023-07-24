import express, { Request, Response } from 'express'
import { errorLogger } from '../utils/winston'
import redisClient from '../models/redis'
import { getUserFromReq } from '../utils/jwt'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

// Route to get the admin announcement
router.get('/announcement', async (req: Request, res: Response) => {
    try {
        const announcement = await redisClient.get('announcement')
        return res.status(200).json({announcement})
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })
        return res.status(500).json({
            message: 'Error interno del servidor',
        })
    }
})

// Route to set the admin announcement
// Only admins can set the announcement
router.post('/announcement', async (req: Request, res: Response) => {
    try {
        const { announcement } = req.body

        const user = await getUserFromReq(req)
        if (!user) {
            return res.status(401).json({
                message: 'No autorizado',
            })
        }

        if (!user.isAdmin) {
            return res.status(403).json({
                message: 'No tienes permiso para realizar esta acción',
            })
        }

        if (!announcement) {
            return res.status(400).json({
                message: 'Anuncio no proporcionado',
            })
        }

        await redisClient.set('announcement', announcement)

        return res.status(200).json({
            message: 'Anuncio actualizado',
        })
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })
        return res.status(500).json({
            message: 'Error interno del servidor',
        })
    }
})



export default router