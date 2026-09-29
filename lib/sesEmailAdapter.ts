import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import type { EmailAdapter, SendEmailOptions } from 'payload'

type AddressLike = string | { name?: string; address: string }

function formatAddress(a: AddressLike): string {
  if (typeof a === 'string') return a
  return a.name ? `"${a.name.replace(/"/g, '')}" <${a.address}>` : a.address
}

function toList(value: SendEmailOptions['to']): string[] {
  if (!value) return []
  return (Array.isArray(value) ? value : [value]).map((v) => formatAddress(v as AddressLike))
}

const asText = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

/**
 * Payload email adapter that sends through Amazon SES, using the same SDK and credentials as the
 * contact form (app/(frontend)/contact-us/actions.ts). Used for the admin's "Forgot password"
 * emails. Credentials come from the standard AWS chain - on EC2, the instance's IAM role - so no
 * keys need to be stored.
 */
export function sesEmailAdapter({
  fromAddress,
  fromName,
  region,
}: {
  fromAddress: string
  fromName: string
  region?: string
}): EmailAdapter {
  return () => {
    const client = new SESClient({ region })
    return {
      name: 'ses',
      defaultFromAddress: fromAddress,
      defaultFromName: fromName,
      sendEmail: async (message) => {
        const html = asText(message.html)
        const text = asText(message.text)
        return client.send(
          new SendEmailCommand({
            Source: formatAddress((message.from as AddressLike) ?? { name: fromName, address: fromAddress }),
            Destination: {
              ToAddresses: toList(message.to),
              CcAddresses: toList(message.cc),
              BccAddresses: toList(message.bcc),
            },
            ReplyToAddresses: message.replyTo ? toList(message.replyTo as SendEmailOptions['to']) : undefined,
            Message: {
              Subject: { Data: message.subject ?? '', Charset: 'UTF-8' },
              Body: {
                ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
                ...(text || !html ? { Text: { Data: text ?? '', Charset: 'UTF-8' } } : {}),
              },
            },
          }),
        )
      },
    }
  }
}
