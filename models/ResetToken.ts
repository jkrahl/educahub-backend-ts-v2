import mongoose, { Document, Schema, Types } from 'mongoose'

interface IResetToken extends Document {
    token: string
    user: Types.ObjectId
    createdAt: Date
}

const ResetTokenSchema = new Schema<IResetToken>({
    token: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
})

const ResetToken = mongoose.model<IResetToken>('ResetToken', ResetTokenSchema)

export default ResetToken