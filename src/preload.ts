import { remote } from 'electron'
const webContentsId = remote.getCurrentWebContents().id
const ep = remote.app.backend.connect(webContentsId)

Object.defineProperty(window, 'connex', {
    enumerable: true,
    value: ep.createConnex()
})

