import jwt from 'jsonwebtoken'
import { Request } from 'express'

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
        hotel: 'trivago',
        isAdmin,
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