import express, { Request, Response } from 'express'
import { errorLogger } from '../utils/winston'
import slugify from 'slugify'
import multer from 'multer'
import Post from '../models/Post'
import { IUser, getUserFromSub } from '../models/User'
import Comment from '../models/Comment'
import Like from '../models/Like'
import { uploadFile } from '../utils/aws'
import { v4 as uuidv4 } from 'uuid'
import { checkJwt } from '../utils/jwt'

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
            .populate<{ user: IUser }>('user', 'username tags')
            .sort({ createdAt: -1 })
            .limit(20)
            .exec()

        // Clean posts
        let cleanedPosts = posts.map((post) => {
            return {
                type: post.type,
                title: post.title,
                description: post.description,
                user: post.user.username,
                tags: post.user.tags,
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
    checkJwt,
    multer({
        limits: {
            fileSize: 25 * 1024 * 1024, // 25 MB
        },
        storage: multer.memoryStorage(),
    }).single('file'),
    async (req: Request, res: Response) => {
        const user = await getUserFromSub(req.auth?.payload.sub || '')

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized',
            })
        }

        const { type, title, description, subject, unit } = req.body

        if (!type || !title) {
            return res.status(400).json({
                message: 'Empty fields',
            })
        }

        // Check if type is Document or Question
        if (type !== 'Document' && type !== 'Question') {
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

        // Check if its a PDF
        if (type === 'Document' && req.file?.mimetype !== 'application/pdf') {
            return res.status(400).json({
                message: 'File must be a PDF',
            })
        }

        try {
            // Create slug
            const slug = slugify(title, {
                lower: true,
            })
            const postURL = `${slug}-${uuidv4().split('-')[0]}`

            // If type is Document, we need to save the file
            if (type === 'Document' && req.file) {
                const uploadSuccess = await uploadFile(
                    req.file.buffer,
                    postURL + '.pdf'
                )
                if (!uploadSuccess) {
                    return res.status(500).json({
                        message: 'Internal server error',
                    })
                }
            }

            // Create post
            const post = await Post.create({
                type,
                title,
                description,
                user: user._id,
                url: postURL,
                subject,
                unit,
            })

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
            .populate<{ user: IUser }>('user', 'username tags')
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
            user: post.user.username,
            tags: post.user.tags,
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

// Route to get the file of a post
router.get('/:postURL/file', async (req: Request, res: Response) => {
    try {
        const post = await Post.findOne({
            url: req.params.postURL,
            type: 'Document',
        })

        // If post doesn't exist, return 404
        if (!post) {
            return res.status(404).json({
                message: 'Not found',
            })
        }

        // Redirect to s3 url
        return res.redirect(
            `https://${process.env.AWS_BUCKET_NAME}.s3.eu-central-1.amazonaws.com/${post.url}.pdf`
        )
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
router.delete('/:postURL', checkJwt, async (req: Request, res: Response) => {
    const user = await getUserFromSub(req.auth?.payload.sub || '')

    if (!user) {
        return res.status(401).json({
            message: 'Unauthorized',
        })
    }

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

        // If user is not the user of the post, return 403
        if (post.user.toString() !== user._id.toString()) {
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
    checkJwt,
    async (req: Request, res: Response) => {
        const user = await getUserFromSub(req.auth?.payload.sub || '')

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized',
            })
        }

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
    checkJwt,
    async (req: Request, res: Response) => {
        const user = await getUserFromSub(req.auth?.payload.sub || '')

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized',
            })
        }

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

            // If user is not the user of the comment, return 403
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

// Route to like a post
router.post(
    '/:postURL/likes',
    checkJwt,
    async (req: Request, res: Response) => {
        const user = await getUserFromSub(req.auth?.payload.sub || '')

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized',
            })
        }

        try {
            // Find post
            const post = await Post.findOne({
                url: req.params.postURL,
            })

            // If post doesn't exist, return 404
            if (!post) {
                return res.status(404).json({
                    message: 'Post not found',
                })
            }

            // Check if user already liked the post
            const alreadyLiked = await Like.findOne({
                likeUser: user._id,
                post: post._id,
            })

            // If user already liked the post, return 400
            if (alreadyLiked) {
                return res.status(400).json({
                    message: 'Already liked',
                })
            }

            // Create like
            await Like.create({
                likeUser: user,
                post: post._id,
                postUser: post.user,
            })

            return res.status(200).json({
                message: 'Post liked',
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

// Route to unlike a post
router.delete(
    '/:postURL/likes',
    checkJwt,
    async (req: Request, res: Response) => {
        const user = await getUserFromSub(req.auth?.payload.sub || '')

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized',
            })
        }

        try {
            // Find post
            const post = await Post.findOne({
                url: req.params.postURL,
            })

            // If post doesn't exist, return 404
            if (!post) {
                return res.status(404).json({
                    message: 'Post not found',
                })
            }

            // Check if user already liked the post
            const alreadyLiked = await Like.findOne({
                likeUser: user._id,
                post: post._id,
            })

            // If user didn't like the post, return 400
            if (!alreadyLiked) {
                return res.status(400).json({
                    message: 'Not liked',
                })
            }

            // Delete like
            await Like.deleteOne({
                likeUser: user._id,
                post: post._id,
                postUser: post.user,
            })

            return res.status(200).json({
                message: 'Post unliked',
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

// Route to get the likes of a post
// User needs to be authenticated
// Route will return the number of likes and if the user liked the post
router.get('/:postURL/likes', checkJwt, async (req: Request, res: Response) => {
    const user = await getUserFromSub(req.auth?.payload.sub || '')

    if (!user) {
        return res.status(401).json({
            message: 'Unauthorized',
        })
    }

    try {
        // Find post
        const post = await Post.findOne({
            url: req.params.postURL,
        })

        // If post doesn't exist, return 404
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
            })
        }

        // Get likes
        const likes = await Like.find({
            post: post._id,
        })

        // Check if user liked the post
        const userLiked = await Like.findOne({
            likeUser: user._id,
            post: post._id,
        })

        return res.status(200).json({
            likes: likes.length,
            userLiked: !!userLiked,
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
