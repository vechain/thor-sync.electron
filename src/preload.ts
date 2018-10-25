import { remote } from 'electron'
import env from '@/env'

declare global {
    interface Window {
        readonly connex: Connex
    }
    const connex: Connex
}

const c = remote.app.EXTENSION.connect(
    env.contents!.id,
    env.xargs!.config!,
    env.xargs!.clientId!
)

Object.defineProperty(window, 'connex', {
    enumerable: true,
    // txQueue is private and only available for browser window
    value: { thor: c.thor, vendor: c.vendor/*, txQueue: c.txQueue */ }
})
