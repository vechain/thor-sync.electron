import { remote } from 'electron'

declare module 'electron' {
    interface App {
        xWorker: {
            maximizeWindow(id: number): Promise<void>
            unmaximizeWindow(id: number): Promise<void>
            minimizeWindow(id: number): Promise<void>
        }
    }
}

remote.app.inject('xWorker', {
    maximizeWindow(id, cb) {
        remote.BrowserWindow.fromId(id).maximize()
        cb()
    },
    unmaximizeWindow(id, cb) {
        remote.BrowserWindow.fromId(id).unmaximize()
        cb()
    },
    minimizeWindow(id, cb) {
        remote.BrowserWindow.fromId(id).minimize()
        cb()
    }
})
