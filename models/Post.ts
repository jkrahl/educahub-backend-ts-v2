import mongoose, { Document, Schema, Types } from 'mongoose'

enum PostType {
    Document = 'Document',
    Link = 'Link',
    Question = 'Question',
}

interface IPost extends Document {
    type: PostType
    title: string
    description?: string
    author: Types.ObjectId
    url: string
    createdAt: Date
    subject?: string
    unit?: string
}

const PostSchema: Schema = new Schema({
    type: { type: String, enum: Object.values(PostType), required: true },
    title: { type: String, required: true },
    description: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String },
    createdAt: { type: Date, default: Date.now, required: true },
    subject: { type: String },
    unit: { type: String },
})

const Post = mongoose.model<IPost>('Post', PostSchema)

export default Post
export { PostType, IPost }
