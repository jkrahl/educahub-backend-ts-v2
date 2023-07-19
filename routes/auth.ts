import express, { Request, Response } from 'express'
import User from '../models/User'
import createJwt from '../utils/jwt'
import { errorLogger } from '../winston'

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
        // Find a non-deleted user with the given email
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

        const token = createJwt(user.username)

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

        const token = createJwt(newUser.username)

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
        // Find a non-deleted user with the given email
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

function validateEmail(email: string) {
    const validRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    return validRegex.test(email)
}

export default router
