import { remote } from 'electron'

const contentsId = remote.getCurrentWebContents().id;

(async () => {
    for (; ;) {
        const payload = await remote.app
            .EXTENSION
            .mq
            .read('WindowAction', contentsId) as WindowAction

        const win = remote.BrowserWindow.fromId(payload.windowId)
        switch (payload.action) {
            case 'maximize':
                win.maximize()
                break
            case 'minimize':
                win.minimize()
                break
            case 'unmaximize':
                win.unmaximize()
                break
        }
    }
})()

