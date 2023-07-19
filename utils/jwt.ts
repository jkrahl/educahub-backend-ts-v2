import jwt from 'jsonwebtoken'

interface JwtPayload {
    username: string
    hotel: string
}

function createJwt(username: string): string {
    const secretKey = process.env.JWT_SECRET_KEY as string

    if (!secretKey) {
        throw new Error('JWT_SECRET_KEY is not set')
    }

    const payload: JwtPayload = {
        username,
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

export default createJwt
