import mongoose from 'mongoose'

interface IUser {
    username: string
    email: string
    password: string
    isAdmin: boolean
    isVerified: boolean
    isBanned: boolean
    registerIP: string
    tags?: string[]
    createdAt: Date
}

const UserSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
    },
    password: {
        type: String,
        required: true,
        minlength: 3,
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true,
    },
    isBanned: {
        type: Boolean,
        default: false,
        required: true,
    },
    registerIP: {
        type: String,
        required: true,
    },
    tags: [
        {
            type: String,
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
})

const User = mongoose.model<IUser>('User', UserSchema)

export default User
