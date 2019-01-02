import { remote, ipcRenderer } from 'electron'
import { create as createConnex } from '@/renderer/connex-impl'

// create connex on demand
const getConnex = (() => {
    let connex: Connex
    return () => {
        if (!connex) {
            const nodeConfig = remote.getCurrentWindow()
                .webContents
                .getWebPreferences()
                .nodeConfig

            const client = remote.app.EXTENSION.connect(
                remote.getCurrentWebContents().id,
                nodeConfig!
            )
            connex = createConnex(client)
        }
        return connex
    }
})()

Object.defineProperty(window, 'connex', {
    enumerable: true,
    get() { return getConnex() }
})
window.addEventListener('load', () => {
    const bgColor = window.getComputedStyle(document.body).getPropertyValue('background-color')
    ipcRenderer.sendToHost('bg-color', bgColor)
})
window.addEventListener('wheel', ev => {
    ipcRenderer.sendToHost('wheel', { x: ev.deltaX, y: ev.deltaY })
}, { passive: true })
