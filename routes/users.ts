import express, { Request, Response } from 'express'
import { errorLogger } from '../utils/winston'
import Post from '../models/Post'
import User, { IUser } from '../models/User'
import { getUserFromReq } from '../utils/jwt'

const router = express.Router()

// Route to get a user
router.get('/:username', async (req: Request, res: Response) => {
    const { username } = req.params
    try {
        const user = await getUserFromReq(req)

        const foundUser = await User.findOne({ username })

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Get all posts from the user
        const posts = await Post.find({ user: foundUser._id })
            .populate<{ user: IUser }>('user', 'username tags')
            .sort({ createdAt: -1 })
            .limit(20)
            .exec()

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

        let cleanedUser = {
            username: foundUser.username,
            isAdmin: foundUser.isAdmin,
            tags: foundUser.tags,
            createdAt: foundUser.createdAt,
        }

        return res.status(200).json({ user: cleanedUser, posts: cleanedPosts })
    } catch (err) {
        errorLogger.error(err)
        return res.status(500).json({ message: 'Internal server error' })
    }
})

export default router
