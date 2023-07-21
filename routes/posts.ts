import express, { Request, Response } from 'express'
import { errorLogger } from '../winston'
import { Request as JWTRequest } from 'express-jwt'
import slugify from 'slugify'
import Post from '../models/Post'
import User, { IUser } from '../models/User'
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

        // If no posts were found, return 404
        if (posts.length === 0) {
            return res.status(404).json({
                message: 'Not posts found',
            })
        }

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

        try {
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
                message: 'Success',
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

export default router
