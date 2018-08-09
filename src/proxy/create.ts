const { createProxyForRemote } = require('electron-remote')
const { BrowserWindow } = require('electron').remote

const proxyWin = BrowserWindow.fromId(1)
const proxy = createProxyForRemote(proxyWin)

export default proxy
