'use server'

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { getPayloadClient } from '@/lib/payload'

export interface ContactFormState {
  status: 'idle' | 'success' | 'error'
  message?: string
}

async function verifyHCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY
  if (!secret) return true // hCaptcha not configured (e.g. local dev) - don't block submissions

  const res = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = (await res.json()) as { success: boolean }
  return data.success
}

async function sendNotificationEmail(fields: {
  name: string
  company: string
  email: string
  phone?: string
  message?: string
}) {
  const from = process.env.SES_FROM_EMAIL
  const to = process.env.SES_TO_EMAIL
  if (!from || !to) return // SES not configured - skip silently rather than failing the submission

  const client = new SESClient({ region: process.env.AWS_REGION })
  const body = [
    `New contact form submission from ${fields.name} (${fields.company})`,
    `Email: ${fields.email}`,
    fields.phone ? `Phone: ${fields.phone}` : null,
    '',
    fields.message || '(no message)',
  ]
    .filter(Boolean)
    .join('\n')

  await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: `New enquiry: ${fields.name} - ${fields.company}` },
        Body: { Text: { Data: body } },
      },
      ReplyToAddresses: [fields.email],
    }),
  )
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: a hidden field real users never fill in. Bots that auto-fill every field trip it.
  if (formData.get('website_url')) {
    return { status: 'success' } // pretend success, drop silently
  }

  const name = String(formData.get('name') || '').trim()
  const company = String(formData.get('company') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const message = String(formData.get('message') || '').trim()
  const captchaToken = String(formData.get('h-captcha-response') || '')

  if (!name || !company || !email) {
    return { status: 'error', message: 'Please fill in your name, company and email.' }
  }

  const captchaOk = await verifyHCaptcha(captchaToken)
  if (!captchaOk) {
    return { status: 'error', message: 'Captcha verification failed - please try again.' }
  }

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'contact-submissions',
    data: { name, company, email, phone, message },
  })

  try {
    await sendNotificationEmail({ name, company, email, phone, message })
  } catch (err) {
    console.error('Failed to send contact notification email', err)
  }

  return { status: 'success' }
}
