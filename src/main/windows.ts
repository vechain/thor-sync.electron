import { BrowserWindow } from 'electron'

const mainUrl =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

// const proxyUrl =
//   process.env.NODE_ENV === 'development'
//     ? `http://localhost:9080/proxy.html`
//     : `file://${__dirname}/proxy.html`

let mainWin: Electron.BrowserWindow | null
// let proxyWin: Electron.BrowserWindow | null

function createMainWin(): Electron.BrowserWindow {
  let opts: Electron.BrowserWindowConstructorOptions = {
    height: 600,
    useContentSize: true,
    show: false,
    width: 800,
    minWidth: 800,
    minHeight: 600
  }

  switch (process.platform) {
    case 'darwin':
      opts.titleBarStyle = 'hiddenInset'
      break
    default:
      // TODO No logic for now
      break
  }

  return new BrowserWindow(opts)
}

// function createProxyWin(): Electron.BrowserWindow {
//   return new BrowserWindow({
//     show: false,
//     titleBarStyle: 'default'
//   })
// }

export const createWin = function() {
  // proxyWin = createProxyWin()
  mainWin = createMainWin()

  // proxyWin.loadURL(proxyUrl)

  // proxyWin.once('ready-to-show', () => {
  //   ;(mainWin as Electron.BrowserWindow).loadURL(mainUrl)
  // })
  ;(mainWin as Electron.BrowserWindow).loadURL(mainUrl)
  // proxyWin.on('closed', () => {
  //   proxyWin = null
  // })

  mainWin.on('closed', () => {
    // if (proxyWin) {
    //   proxyWin.close()
    // }
    mainWin = null
  })

  mainWin.once('ready-to-show', () => {
    ;(mainWin as Electron.BrowserWindow).show()
  })
}
