import { remote } from 'electron'

declare global {
    interface Window {
        readonly connex: Connex
    }
    const connex: Connex
}

// create connex on demand
const getConnex = (() => {
    let connex: Connex
    return () => {
        if (!connex) {
            const siteConfig = remote.getCurrentWindow()
                .webContents
                .getWebPreferences()
                .siteConfig

            connex = {
                ...remote.app.EXTENSION.connect(
                    remote.getCurrentWebContents().id,
                    siteConfig!
                )
            }
            // txQueue is private and only available for browser window
            delete connex.txQueue
        }
        return connex
    }
})()

Object.defineProperty(window, 'connex', {
    enumerable: true,
    get() { return getConnex() }
})
