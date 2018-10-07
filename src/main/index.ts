import { app } from 'electron'
import { Backend, SiteConfig } from './backend'
import { setupMenu } from './menu'
import WindowManager from './window-manager'

// tslint:disable-next-line:no-var-requires
require('electron-unhandled')({
    //    logger: console.error,
    showDialog: false
})

declare module 'electron' {
    interface App {
        backend: Backend
        xWorker: XWorker
        createWindow(
            siteConfig?: SiteConfig,
            options?: BrowserWindowConstructorOptions
        ): BrowserWindow
    }
}

const winMgr = new WindowManager()

app.backend = new Backend()
app.createWindow = (siteConfig, options) => winMgr.create(siteConfig, options)

let _xWorker: XWorker
Object.defineProperty(app, 'xWorker', {
    set(val: any) {
        _xWorker = val
    },
    get() {
        return _xWorker
    },
    enumerable: true
})

app.once('ready', () => {
    setupMenu()

    winMgr.initXWorker().webContents.once('dom-ready', () => {
        winMgr.create()
    })
}).on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (winMgr.activeCount === 0) {
        winMgr.create()
    }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
