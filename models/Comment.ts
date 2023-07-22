import mongoose, { Document, Schema, Types } from 'mongoose'

interface IComment extends Document {
    uuid: string
    text: string
    user: Types.ObjectId
    post: Types.ObjectId
    createdAt: Date
}

const CommentSchema = new Schema<IComment>({
    uuid: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
})

const Comment = mongoose.model<IComment>('Comment', CommentSchema)

export default Comment
export { IComment }