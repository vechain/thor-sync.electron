import { remote } from 'electron'

// create connex on demand
const getConnex = (() => {
    let connex: Connex
    return () => {
        if (!connex) {
            const nodeConfig = remote.getCurrentWindow()
                .webContents
                .getWebPreferences()
                .nodeConfig

            connex = remote.app.EXTENSION.connect(
                remote.getCurrentWebContents().id,
                nodeConfig!
            ).connex
        }
        return connex
    }
})()

Object.defineProperty(window, 'connex', {
    enumerable: true,
    get() { return getConnex() }
})
