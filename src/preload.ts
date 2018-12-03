import { remote } from 'electron'

// create connex on demand
const getConnex = (() => {
    let connex: Connex
    return () => {
        if (!connex) {
            const siteConfig = remote.getCurrentWindow()
                .webContents
                .getWebPreferences()
                .siteConfig

            connex = remote.app.EXTENSION.connect(
                remote.getCurrentWebContents().id,
                siteConfig!
            ).connex
        }
        return connex
    }
})()

Object.defineProperty(window, 'connex', {
    enumerable: true,
    get() { return getConnex() }
})
