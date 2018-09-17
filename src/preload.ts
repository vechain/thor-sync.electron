import { remote } from 'electron'
import env from '@/env'

declare module 'electron' {
    interface WebContents {
        getWebPreferences(): WebPreferences
    }
}

declare global {
    interface Window {
        readonly connex: Connex
    }
    const connex: Connex
}

if (env.devMode) {
    remote.getCurrentWebContents().openDevTools()
}

const webContents = remote.getCurrentWebContents()
const partition = webContents.getWebPreferences().partition

const userAddr = partition ? new URL(partition).pathname.split('/').pop() : undefined

Object.defineProperty(window, 'connex', {
    enumerable: true,
    value: remote.app.backend.connect(webContents.id, userAddr)
})
