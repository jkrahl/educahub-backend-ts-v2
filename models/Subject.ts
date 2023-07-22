import mongoose, { Schema, Document, Types } from 'mongoose'

// Define the interface for the Subject document (optional but recommended)
interface ISubject extends Document {
    name: string
    units: Types.Array<string>
}

// Create the Mongoose schema for the Subject
const subjectSchema: Schema<ISubject> = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    units: [
        {
            type: String,
            required: true,
        },
    ],
})

// Create and export the Subject model
const Subject = mongoose.model<ISubject>('Subject', subjectSchema)

export default Subject
