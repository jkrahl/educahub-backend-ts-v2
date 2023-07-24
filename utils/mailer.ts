import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

export async function sendResetToken(email: string, token: string) {
    if (!process.env.MAILERSEND_API_KEY) {
        throw new Error('Missing MAILERSEND_API_KEY')
    }

    const mailerSend = new MailerSend({
        apiKey: process.env.MAILERSEND_API_KEY,
    })

    const sentFrom = new Sender('no-reply@educahub.app', 'EducaHub')

    const recipients = [new Recipient(email)]

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject('Restablece tu contraseña de EducaHub')
        .setHtml(
            'Restablece tu contraseña aquí: https://educahub.app/reset/' + token
        )
        .setText(
            'Restablece tu contraseña aquí: https://educahub.app/reset/' + token
        )

    await mailerSend.email.send(emailParams)
}
