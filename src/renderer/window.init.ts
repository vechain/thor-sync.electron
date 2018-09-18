import env from '@/env'
import Wallet from './wallet'
const remote = require('electron').remote
const win = remote.getCurrentWindow()
const style = 'full-screen'
let bodyEle = document.body
let platform = process.platform

declare interface ILib {
  sign?(contentId: number, Clouse?: object[]): Promise<string>
  DApps?: string[]
}

declare global {
  interface Window {
    ENV: typeof env
    walletStore: Wallet.Store
    Lib: ILib
  }
}

window.ENV = env
window.walletStore = new Wallet.Store()
window.Lib = {
  DApps: remote.app.DApps
}

function init() {
  bodyEle.classList.add(platform)
  if (win.isFullScreen()) {
    bodyEle.classList.add(style)
  } else {
    bodyEle.classList.remove(style)
  }

  win.on('enter-full-screen', function() {
    bodyEle.classList.add(style)
  })
  win.on('leave-full-screen', function() {
    bodyEle.classList.remove(style)
  })
}
init()
