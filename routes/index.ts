import express, { Request, Response } from 'express'
import { errorLogger } from '../utils/winston'
import { getUserFromReq } from '../utils/jwt'
import announcement from '../utils/announcement'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

// Route to get the admin announcement
router.get('/announcement', async (req: Request, res: Response) => {
    try {
        return res.status(200).json({ announcement: announcement.getAnnouncement() })
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
        const newAnnouncement = req.body.announcement

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

        if (!newAnnouncement) {
            return res.status(400).json({
                message: 'Anuncio no proporcionado',
            })
        }

        announcement.setAnnouncement(newAnnouncement)

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

// Route to get the request logs
// Only admins can get the request logs
router.get('/logs', async (req: Request, res: Response) => {
    try {
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

        // Get requests.log file
        const filePath = 'requests.log'

        return res.sendFile(filePath, { root: './' })

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
