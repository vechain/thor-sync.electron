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
    maximizeWindow: (id: number, cb: () => void) => {
        remote.BrowserWindow.fromId(id).maximize()
        cb()
    },
    unmaximizeWindow: (id: number, cb: () => void) => {
        remote.BrowserWindow.fromId(id).unmaximize()
        cb()
    },
    minimizeWindow: (id: number, cb: () => void) => {
        remote.BrowserWindow.fromId(id).minimize()
        cb()
    }
})
