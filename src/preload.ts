import { remote } from 'electron'

declare global {
    interface Window {
        readonly connex: Connex
    }
    const connex: Connex
}

const siteConfig = remote.getCurrentWindow()
    .webContents
    .getWebPreferences()
    .siteConfig

const c = remote.app.EXTENSION.connect(
    remote.getCurrentWebContents().id,
    siteConfig!
)

Object.defineProperty(window, 'connex', {
    enumerable: true,
    // txQueue is private and only available for browser window
    value: { thor: c.thor, vendor: c.vendor/*, txQueue: c.txQueue */ }
})
