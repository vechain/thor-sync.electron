import { remote } from 'electron'
import { adaptError } from './common/adapt-error'

// create connex on demand
const getConnex = (() => {
    let connex: Connex
    return () => {
        if (!connex) {
            const nodeConfig = remote.getCurrentWindow()
                .webContents
                .getWebPreferences()
                .nodeConfig

            connex = adaptError(remote.app.EXTENSION.connect(
                remote.getCurrentWebContents().id,
                nodeConfig!
            ).connex, true)
        }
        return connex
    }
})()

Object.defineProperty(window, 'connex', {
    enumerable: true,
    get() { return getConnex() }
})
