import mongoose, { Document, Schema, Types } from 'mongoose'

interface ILike extends Document {
    user: Types.ObjectId
    post: Types.ObjectId
    createdAt: Date
}

const LikeSchema = new Schema<ILike>({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    post: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
})

const Like = mongoose.model<ILike>('Like', LikeSchema)

export default Like