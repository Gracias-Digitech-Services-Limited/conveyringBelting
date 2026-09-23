import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

let cached: Promise<Payload> | null = null

/** Reuses a single Payload instance across requests in the same server process. */
export function getPayloadClient(): Promise<Payload> {
  if (!cached) {
    // If the connection attempt fails (e.g. MongoDB wasn't up yet), clear the cache instead
    // of permanently pinning every future request to the same rejected promise - otherwise
    // one transient failure at boot breaks the whole server until it's restarted.
    cached = getPayload({ config }).catch((err) => {
      cached = null
      throw err
    })
  }
  return cached
}
