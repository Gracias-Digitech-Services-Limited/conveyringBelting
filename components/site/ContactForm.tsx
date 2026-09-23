'use client'

import { useActionState } from 'react'
import Script from 'next/script'
import { AnimatePresence, motion } from 'framer-motion'
import { submitContactForm, type ContactFormState } from '@/app/(frontend)/contact-us/actions'

const initialState: ContactFormState = { status: 'idle' }

const labelClass = 'block text-sm font-medium text-foreground'
const inputClass =
  'mt-1 w-full rounded-md border border-border-subtle bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-brand-amber focus:outline-none focus:ring-1 focus:ring-brand-amber'

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState)
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

  return (
    <AnimatePresence mode="wait">
      {state.status === 'success' ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-md border border-green-300 bg-green-50 p-6 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
        >
          <p className="font-semibold">Thanks - your message has been sent.</p>
          <p className="mt-1 text-sm">A member of our team will be in touch shortly.</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          action={formAction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative space-y-5"
        >
          {siteKey && <Script src="https://js.hcaptcha.com/1/api.js" async defer />}

          {/* Honeypot field - hidden from real visitors via CSS, bots that fill every field trip it */}
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <label htmlFor="website_url">Leave this field empty</label>
            <input type="text" id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>
                Your name *
              </label>
              <input id="name" name="name" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="company" className={labelClass}>
                Company name *
              </label>
              <input id="company" name="company" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email *
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <input id="phone" name="phone" type="tel" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="message" className={labelClass}>
              Comment or Message
            </label>
            <textarea id="message" name="message" rows={5} className={inputClass} />
          </div>

          {siteKey && <div className="h-captcha" data-sitekey={siteKey} />}

          {state.status === 'error' && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{state.message}</p>
          )}

          <motion.button
            type="submit"
            disabled={pending}
            whileHover={{ scale: pending ? 1 : 1.03 }}
            whileTap={{ scale: pending ? 1 : 0.97 }}
            className="rounded-md bg-brand-amber px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-amber-light disabled:opacity-60"
          >
            {pending ? 'Sending…' : 'Submit'}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
