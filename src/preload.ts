import { remote } from 'electron'
import { proxyObject } from './common/object-proxy'

// create connex on demand
const getConnex = (() => {
    let connex: Connex
    return () => {
        if (!connex) {
            const nodeConfig = remote.getCurrentWindow()
                .webContents
                .getWebPreferences()
                .nodeConfig

            connex = proxyObject(remote.app.EXTENSION.connect(
                remote.getCurrentWebContents().id,
                nodeConfig!
            ).connex, true, { disconnected: false })
        }
        return connex
    }
})()

Object.defineProperty(window, 'connex', {
    enumerable: true,
    get() { return getConnex() }
})
