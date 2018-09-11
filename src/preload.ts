import { remote } from 'electron'
const webContentsId = remote.getCurrentWebContents().id
const conn = remote.app.backend.connect(webContentsId)

Object.defineProperty(window, 'connex', {
    enumerable: true,
    value: conn.createConnex()
})

