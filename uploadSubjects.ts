import Subject from "./models/Subject"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

;(async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not found')

    await mongoose.connect(process.env.MONGO_URI as string)

    // Get subjects from url
    const url = 'https://raw.githubusercontent.com/jkrahl/selectivitat/main/temari.json'
    const response = await fetch(url)
    const subjects = await response.json()

    // Create subjects
    for (const subject of subjects) {
        const newSubject = new Subject({
            name: subject.name,
            units: subject.units,
        })
        await newSubject.save()
    }

    console.log('Subjects uploaded')
}
)()
