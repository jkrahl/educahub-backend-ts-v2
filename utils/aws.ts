import {
    S3Client,
    PutObjectCommand,
    PutObjectCommandInput,
    GetObjectCommand,
} from '@aws-sdk/client-s3'
import { errorLogger } from './winston'

const s3Config = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
    region: 'eu-central-1',
}

const s3Client = new S3Client(s3Config)

// Upload file to AWS S3 function that returns an OK response if the upload was successful
export const uploadFile = async (file: any, fileName: string) => {
    if(!process.env.AWS_BUCKET_NAME) throw new Error('AWS_BUCKET_NAME not found')
    if(!process.env.AWS_ACCESS_KEY) throw new Error('AWS_ACCESS_KEY not found')
    if(!process.env.AWS_ACCESS_SECRET) throw new Error('AWS_ACCESS_SECRET not found')
    
    const params: PutObjectCommandInput = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.data,
    }

    try {
        const res = await s3Client.send(new PutObjectCommand(params))
        console.log(res)
        return {
            success: true,
        }
    } catch (err) {
        errorLogger.error(err)
        return {
            success: false,
        }
    }
}
