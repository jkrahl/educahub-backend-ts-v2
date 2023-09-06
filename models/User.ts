import mongoose, { Document, Schema, Types } from 'mongoose'

interface IUser extends Document {
    username: string
    sub: string
    tags: Types.Array<string>
}

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
    },
    sub: {
        type: String,
        required: true,
        unique: true,
    },
    tags: {
        type: [String],
    },
})

// Function to get user from sub
const getUserFromSub = async function (sub: string) {
    if (!sub) {
        return null
    }
    const user = await User.findOne({ sub })
    if (!user) {
        return null
    }
    return user
}

const User = mongoose.model<IUser>('User', UserSchema)

export default User
export { IUser, getUserFromSub }
