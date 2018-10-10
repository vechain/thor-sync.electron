import { remote } from 'electron'
import env from '@/env'

declare global {
    interface Window {
        readonly connex: Connex
    }
    const connex: Connex
}

const contents = remote.getCurrentWebContents()

if (env.devMode) {
    contents.openDevTools()
}

const hostClientId = contents.hostWebContents.getWebPreferences()['xargs.clientId']!
const config = contents.hostWebContents.getWebPreferences()['xargs.config']!

Object.defineProperty(window, 'connex', {
    enumerable: true,
    value: remote.app.EXTENSION.connect(
        contents.id,
        config,
        `${hostClientId}.${env.clientId!}`
    )
})
