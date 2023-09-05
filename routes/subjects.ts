import express, { Request, Response } from 'express'
import Subject from '../models/Subject'

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
    // Get name and units of all subjects
    const subjects = await Subject.find({}, ['name', 'units'])

    // Clean up the units array
    const cleanedSubjects = subjects.map((subject) => {
        return {
            name: subject.name,
            units: subject.units,
        }
    })

    return res.status(200).json(cleanedSubjects)
})

export default router
