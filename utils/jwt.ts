import jwt from 'jsonwebtoken'
import { Request } from 'express'
import User from '../models/User'

interface JwtPayload {
    username: string
    hotel: string
    isAdmin: boolean
}

export function createJwt(username: string, isAdmin: boolean): string {
    const secretKey = process.env.JWT_SECRET_KEY as string

    if (!secretKey) {
        throw new Error('JWT_SECRET_KEY is not set')
    }

    const payload: JwtPayload = {
        username,
        isAdmin,
        hotel: 'trivago',
    }

    const options: jwt.SignOptions = {
        expiresIn: '28d',
        algorithm: 'HS256',
        audience: 'https://api.educahub.app/',
        issuer: 'https://api.educahub.app/',
    }

    const token = jwt.sign(payload, secretKey, options)
    return token
}

export async function getUserFromReq(req: Request) {
    try {
        const token = req.headers.authorization?.split(' ')[1] as string

        const secretKey = process.env.JWT_SECRET_KEY as string
        if (!secretKey) {
            throw new Error('JWT_SECRET_KEY is not set')
        }

        const decoded = jwt.verify(token, secretKey) as JwtPayload
        
        const user = await User.findOne({ username: decoded.username })
        if (!user) {
            return null
        }
        return user
    } catch (error) {
        return null
    }
}
