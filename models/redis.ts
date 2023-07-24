import { createClient } from 'redis'
import { errorLogger } from '../utils/winston'

const client = createClient()

client.on('error', (err) => {
    errorLogger.error({
        message: err.message,
    })
})

export default client
