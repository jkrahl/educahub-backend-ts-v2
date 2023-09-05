import express, { Request, Response } from 'express'
import User, { IUser } from '../models/User'
import { checkJwt } from '../utils/jwt'
import { errorLogger } from '../utils/winston'

const router = express.Router()

router.post('/register', checkJwt, async (req: Request, res: Response) => {
    const { username } = req.body
    // Get sub from request
    const sub = req.auth?.payload.sub

    if (!username) {
        return res.status(400).json({
            message: 'Nombre de usuario vacío',
        })
    }

    try {
        // Find a user with the given username
        const user = await User.findOne({
            username,
        })
        if (user) {
            return res.status(409).json({
                message: 'Usuario ya existe',
            })
        }

        // Find a user with the given sub
        const userWithSub = await User.findOne({
            sub,
        })

        // If user with sub exists, update username
        if (userWithSub) {
            userWithSub.username = username
            await userWithSub.save()
            return res.status(200).json({
                message: 'Usuario actualizado exitosamente',
            })
        }

        // Create new user
        const newUser: IUser = new User({
            sub,
            username,
        })

        // Save user
        await newUser.save()

        return res.status(201).json({
            message: 'Usuario creado exitosamente',
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

// Get username from sub
router.get('/me', checkJwt, async (req: Request, res: Response) => {
    // Get sub from request
    const sub = req.auth?.payload.sub

    // Find user with given sub
    const user = await User.findOne({
        sub,
    })

    // If user does not exist, return 404
    if (!user) {
        return res.status(404).json({
            message: 'Usuario no encontrado',
        })
    }

    // Return user
    return res.json({
        username: user.username,
        tags: user.tags,
    })
})

export default router
