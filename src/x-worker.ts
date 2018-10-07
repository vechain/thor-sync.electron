import { remote } from 'electron'

declare global {
    interface XWorker {
        maximizeWindow(id: number): Promise<void>
        unmaximizeWindow(id: number): Promise<void>
        minimizeWindow(id: number): Promise<void>
    }
}

remote.app.xWorker = {
    async maximizeWindow(id: number) {
        remote.BrowserWindow.fromId(id).maximize()
    },
    async unmaximizeWindow(id: number) {
        remote.BrowserWindow.fromId(id).unmaximize()
    },
    async minimizeWindow(id: number) {
        remote.BrowserWindow.fromId(id).minimize()
    }
}
