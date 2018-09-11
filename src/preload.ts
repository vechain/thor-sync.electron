import { remote } from 'electron'
const webContentsId = remote.getCurrentWebContents().id
const conn = remote.app.backend.connect(webContentsId)

if (process.env.NODE_ENV === 'development') {
  remote.getCurrentWebContents().openDevTools()
}

Object.defineProperty(window, 'connex', {
    enumerable: true,
    value: conn.createConnex()
})
