import { expressjwt } from 'express-jwt'

export const jwt = expressjwt({
    secret: process.env.JWT_SECRET_KEY as string,
    algorithms: ['HS256'],
    audience: 'https://api.educahub.app/',
    issuer: 'https://api.educahub.app/',
})
