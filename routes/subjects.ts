import express, { Request, Response } from 'express'
import { errorLogger } from '../utils/winston'
import { getUserFromReq } from '../utils/jwt'
import Subject from '../models/Subject'

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
    // Get name and units of all subjects
    const allSubjects = await Subject.find({}, ['name', 'units'])

    return res.status(200).json({
        message: 'Success',
        subjects: allSubjects,
    })
})

// Route to create multiple subjects
router.post('/', async (req: Request, res: Response) => {
    const user = await getUserFromReq(req)
    // If not admin, return 401
    if (!user?.isAdmin) {
        return res.status(401).json({
            message: 'Unauthorized',
        })
    }

    const { subjects } = req.body

    if (!subjects) {
        return res.status(400).json({
            message: 'Bad request',
        })
    }

    try {
        await Subject.insertMany(subjects)

        return res.status(201).json({
            message: 'Success',
        })
    }
    catch (e: any) {
        errorLogger.error({
            message: e.message,
        })

        return res.status(500).json({
            message: 'Internal server error',
        })
    }
})

export default router