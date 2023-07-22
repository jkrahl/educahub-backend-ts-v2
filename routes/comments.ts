import express, { Request, Response } from 'express'
import { errorLogger } from '../winston'
import { Request as JWTRequest } from 'express-jwt'
import Comment from '../models/Comment'
import Post from '../models/Post'
import User, { IUser } from '../models/User'
import { jwt } from '../middleware/jwt'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Route to create a comment
router.post('/', jwt, async (req: JWTRequest, res: Response) => {
    const { commentText, postURL } = req.body

    if (!commentText || !postURL) {
        return res.status(400).json({
            message: 'Missing parameters',
        })
    }

    try {
        // Find post
        const post = await Post.findOne({ url: postURL })

        // If no post was found, return 400
        if (!post) {
            return res.status(400).json({
                message: 'Post not found',
            })
        }

        // Get user id from database
        const username = req.auth?.username
        const user = await User.findOne({ username }, '_id')

        // If user doesn't exist, return 404
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            })
        }

        // Generate uuid
        const uuid = uuidv4()

        // Create comment
        const comment = await Comment.create({
            uuid,
            text: commentText,
            user: user._id,
            post: post._id,
        })

        // Return comment
        return res.status(200).json({
            message: 'Comment created',
            commentUUID: comment.uuid,
        })
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })

        return res.status(500).json({
            message: 'Internal server error',
        })
    }
})

// Route to get all comments from a post
router.get('/:postURL', async (req: Request, res: Response) => {
    try {
        const post = await Post.findOne({
            url: req.params.postURL,
        })

        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
            })
        }

        const comments = await Comment.find({
            post: post._id,
        })
            .populate<{ user: IUser }>('user', 'username tags')
            .exec()

        const cleanedComments = comments.map((comment) => {
            return {
                uuid: comment.uuid,
                text: comment.text,
                user: comment.user.username,
                tags: comment.user.tags,
                createdAt: comment.createdAt,
            }
        })

        return res.status(200).json(cleanedComments)
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })

        return res.status(500).json({
            message: 'Internal server error',
        })
    }
})

// Route to delete a comment
router.delete('/:commentUUID', jwt, async (req: JWTRequest, res: Response) => {
    try {
        // Find comment
        const comment = await Comment.findOne({
            uuid: req.params.commentUUID,
        })

        // If comment doesn't exist, return 404
        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found',
            })
        }

        // Get user id from database
        const username = req.auth?.username
        const user = await User.findOne({ username }, '_id')

        // If user doesn't exist, return 404
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            })
        }

        // If user is not the author of the comment, return 403
        if (comment.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: 'Forbidden',
            })
        }

        // Delete comment
        await Comment.deleteOne({
            uuid: req.params.commentUUID,
        })

        return res.status(200).json({
            message: 'Comentario eliminado exitosamente',
        })
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })
        return res.status(500).json({
            message: 'Internal server error',
        })
    }
})

export default router
