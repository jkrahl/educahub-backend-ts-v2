import express, { Request, Response } from 'express'
import { errorLogger } from '../winston'
import { Request as JWTRequest } from 'express-jwt'
import slugify from 'slugify'
import Post from '../models/Post'
import User, { IUser } from '../models/User'
import Comment from '../models/Comment'
import { jwt } from '../middleware/jwt'
import upload from '../middleware/multer'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Route to get multiple posts
router.get('/', async (req: Request, res: Response) => {
    const { q, subject, unit } = req.query

    // If defined, we look for coincidences in title and description
    const searchRegex = q ? new RegExp(q as string, 'i') : undefined

    let filter: any = {}

    // If searchRegex is defined, we add it to the filter
    if (searchRegex) {
        filter = {
            $or: [{ title: searchRegex }, { description: searchRegex }],
        }
    }
    if (subject) filter.subject = subject
    if (unit) filter.unit = unit

    try {
        const posts = await Post.find(filter)
            .populate<{ author: IUser }>('author', 'username tags')
            .exec()

        // Clean posts
        let cleanedPosts = posts.map((post) => {
            return {
                type: post.type,
                title: post.title,
                description: post.description,
                author: post.author.username,
                tags: post.author.tags,
                url: post.url,
                createdAt: post.createdAt,
                subject: post.subject,
                unit: post.unit,
            }
        })

        return res.status(200).json(cleanedPosts)
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })

        return res.status(500).json({
            message: 'Internal server error',
        })
    }
})

// Route to create a post
router.post(
    '/',
    jwt,
    upload.single('file'),
    async (req: JWTRequest, res: Response) => {
        const { type, title, description, subject, unit } = req.body

        if (!type || !title) {
            return res.status(400).json({
                message: 'Empty fields',
            })
        }

        // Check if type is Document, Link or Question
        if (type !== 'Document' && type !== 'Link' && type !== 'Question') {
            return res.status(400).json({
                message: 'Bad request',
            })
        }

        // If type is Document, we need to check if a file was uploaded
        if (type === 'Document' && !req.file) {
            return res.status(400).json({
                message: 'No file uploaded',
            })
        }

        try {
            // Get user id from database
            const username = req.auth?.username
            const user = await User.findOne({ username }, '_id')

            // If user doesn't exist, return 404
            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                })
            }

            // Create slug
            const slug = slugify(title, {
                lower: true,
            })
            const postURL = `${slug}-${uuidv4().split('-')[0]}`

            // Create post
            const post = await Post.create({
                type,
                title,
                description,
                author: user._id,
                url: postURL,
                subject,
                unit,
            })

            // If type is Document, we need to save the file
            /*if (type === 'Document') {
        await uploadFile(req.file, postURL)
    }*/

            return res.status(201).json({
                message: 'Post creado exitosamente',
                url: post.url,
            })
        } catch (e: any) {
            errorLogger.error({
                message: e.message,
            })

            return res.status(500).json({
                message: 'Internal server error',
            })
        }
    }
)

// Route to get a single post
router.get('/:postURL', async (req: Request, res: Response) => {
    try {
        const post = await Post.findOne({
            url: req.params.postURL,
        })
            .populate<{ author: IUser }>('author', 'username tags')
            .exec()

        // If post doesn't exist, return 404
        if (!post) {
            return res.status(404).json({
                message: 'Not found',
            })
        }

        let cleanedPost = {
            type: post.type,
            title: post.title,
            description: post.description,
            author: post.author.username,
            tags: post.author.tags,
            url: post.url,
            createdAt: post.createdAt,
            subject: post.subject,
            unit: post.unit,
        }

        return res.status(200).json(cleanedPost)
    } catch (e: any) {
        errorLogger.error({
            message: e.message,
        })

        return res.status(500).json({
            message: 'Internal server error',
        })
    }
})

// Route to delete a post
router.delete('/:postURL', jwt, async (req: JWTRequest, res: Response) => {
    try {
        // Find post
        const post = await Post.findOne({
            url: req.params.postURL,
        })

        // If post doesn't exist, return 404
        if (!post) {
            return res.status(404).json({
                message: 'Not found',
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

        // If user is not the author of the post, return 403
        if (post.author.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: 'Forbidden',
            })
        }

        // Delete post
        await Post.deleteOne({
            url: req.params.postURL,
        })

        return res.status(200).json({
            message: 'Post eliminado exitosamente',
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

// Route to create a comment
router.post(
    '/:postURL/comments',
    jwt,
    async (req: JWTRequest, res: Response) => {
        const postURL = req.params.postURL
        const { content } = req.body

        if (!content || !postURL) {
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
                text: content,
                user: user._id,
                post: post._id,
            })

            // Return comment
            return res.status(200).json({
                message: 'Comentario creado exitosamente',
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
    }
)

// Route to get the comments of a post
router.get('/:postURL/comments', async (req: Request, res: Response) => {
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
router.delete(
    '/:postURL/comments/:commentUUID',
    jwt,
    async (req: JWTRequest, res: Response) => {
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

            // Check if post exists and coincides with the comment
            const post = await Post.findById(comment.post)

            // If post doesn't exist, return 404
            if (!post) {
                return res.status(404).json({
                    message: 'Post not found',
                })
            }

            // If post doesn't coincide with the comment, return 404
            if (post.url !== req.params.postURL) {
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
    }
)

export default router
