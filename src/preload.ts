import { remote } from 'electron'
import env from '@/env'

declare global {
    interface Window {
        readonly connex: Connex
    }
    const connex: Connex
}

if (env.devMode) {
    env.contents!.openDevTools()
}

Object.defineProperty(window, 'connex', {
    enumerable: true,
    value: remote.app.EXTENSION.connect(
        env.contents!.id,
        env.xargs!.config!,
        env.xargs!.clientId!
    )
})
