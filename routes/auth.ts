import express, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import User from '../models/User'
import { createJwt } from '../utils/jwt'
import { errorLogger } from '../utils/winston'
import redisClient from '../models/redis'
import { sendResetToken } from '../utils/mailer'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            message: 'Campos vacíos',
        })
    }

    try {
        // Find a user with the given email
        const user = await User.findOne({
            email,
        })

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado',
            })
        }

        if (user.isBanned) {
            return res.status(403).json({
                message: 'Usuario baneado',
            })
        }

        if (user.password !== password) {
            return res.status(403).json({
                message: 'Contraseña incorrecta',
            })
        }

        const token = createJwt(user.username, user.isAdmin)

        return res.status(200).json({
            message: 'Login exitoso',
            token,
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

router.post('/register', async (req: Request, res: Response) => {
    const { username, email, password } = req.body
    const ip = req.ip

    if (!username || !email || !password) {
        return res.status(400).json({
            message: 'Campos vacíos',
        })
    }

    //Validate email
    if (!validateEmail(email)) {
        return res.status(400).json({
            message: 'Email inválido',
        })
    }

    //Validate password
    if (password.length < 3) {
        return res.status(400).json({
            message: 'Contraseña debe tener al menos 3 caracteres',
        })
    }

    //Validate username
    if (username.length < 3) {
        return res.status(400).json({
            message: 'Nombre de usuario debe tener al menos 3 caracteres',
        })
    }

    try {
        // Find a user with the given email or given username
        const user = await User.findOne({
            $or: [email ? { email } : {}, username ? { username } : {}],
        })

        if (user) {
            return res.status(409).json({
                message: 'Usuario ya existe',
            })
        }

        const newUser = new User({
            username,
            email,
            password,
            registerIP: ip,
        })

        await newUser.save()

        const token = createJwt(newUser.username, newUser.isAdmin)

        return res.status(201).json({
            message: 'Usuario creado exitosamente',
            token,
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

router.delete('/delete', async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            message: 'Campos vacíos',
        })
    }

    try {
        // Find a user with the given email
        const user = await User.findOne({
            email,
        })

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado',
            })
        }

        if (user.password !== password) {
            return res.status(403).json({
                message: 'Contraseña incorrecta',
            })
        }

        //Delete document
        await User.deleteOne({ email })

        return res.status(200).json({
            message: 'Usuario eliminado exitosamente',
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

// Route to request a password reset token
router.post('/reset', async (req: Request, res: Response) => {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({
            message: 'Campos vacíos',
        })
    }

    // Validate email
    if (!validateEmail(email)) {
        return res.status(400).json({
            message: 'Email inválido',
        })
    }

    try {
        // Find a non-deleted user with the given email
        const user = await User.findOne({
            email,
        })

        // If user doesn't exist, return 200 anyway
        if (!user) {
            return res.status(200).json({
                message: 'OK',
            })
        }

        // Generate a reset token
        const token = uuidv4()

        // Save the token in Redis
        await redisClient.set(`reset:${token}`, email, {
            EX: 60 * 60 * 24,
        })

        // Send the token to the user's email
        await sendResetToken(email, token)

        return res.status(200).json({
            message: 'OK',
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

// Route to reset a password
router.post('/reset/:token', async (req: Request, res: Response) => {
    const { token } = req.params
    const { password } = req.body

    if (!token || !password) {
        return res.status(400).json({
            message: 'Campos vacíos',
        })
    }

    try {
        // Find the email associated with the token
        const email = await redisClient.get(`reset:${token}`)
        if (!email) {
            return res.status(404).json({
                message: 'Token inválido o caducado',
            })
        }

        // Find a user with the given email
        const user = await User.findOne({
            email,
        })

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado',
            })
        }

        // Update the user's password
        user.password = password

        // Save the user
        await user.save()

        // Delete the token
        await redisClient.del(`reset:${token}`)
        return res.status(200).json({
            message: 'OK',
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

function validateEmail(email: string) {
    const validRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    return validRegex.test(email)
}

export default router
