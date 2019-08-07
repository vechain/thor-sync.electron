import { ipcRenderer } from 'electron'
import { AppDriver } from '@/renderer/connex-driver/app-driver'
import { Framework } from '@vechain/connex-framework'

// create connex on demand
const getConnex = (() => {
    let connex: Connex
    return () => {
        if (!connex) {
            connex = new Framework(new AppDriver())
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

// workaround to https://github.com/electron/electron/issues/14258
window.addEventListener('keydown', ev => {
    ipcRenderer.sendToHost('keydown', {
        key: ev.key,
        keyCode: ev.keyCode,
        code: ev.code,
        shiftKey: ev.shiftKey,
        altKey: ev.altKey,
        ctrlKey: ev.ctrlKey,
        metaKey: ev.metaKey,
        repeat: ev.repeat
    })
})
