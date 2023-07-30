import mongoose, { Document, Schema, Types } from 'mongoose'

interface ILike extends Document {
    likeUser: Types.ObjectId
    post: Types.ObjectId
    postUser: Types.ObjectId
    createdAt: Date
}

const LikeSchema = new Schema<ILike>({
    likeUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    postUser: {
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

const Like = mongoose.model<ILike>('Like', LikeSchema)

export default Like
