import { app, webContents, WebPreferences, BrowserWindow } from 'electron'
import { Backend } from './backend'
import { setupMenu } from './menu'
import WindowManager from './window-manager'
import inject from './inject'
import env from '../env'

// tslint:disable-next-line:no-var-requires
require('electron-unhandled')({
    //    logger: console.error,
    showDialog: false
})

// tslint:disable-next-line:no-var-requires
const contextMenu = require('electron-context-menu')
// for all browserWindow
contextMenu()

declare module 'electron' {
    interface App {
        EXTENSION: {
            connect(
                contentsId: number,
                config: Connex.Thor.Site.Config,
                clientId: string[]
            ): Connex

            inject(
                contentsId: number,
                path: string,
                obj: {
                    [prop: string]: (...args: any[]) => void
                }): void

            createWindow(
                config?: Connex.Thor.Site.Config,
                options?: BrowserWindowConstructorOptions
            ): BrowserWindow
        }
    }
}

const winMgr = new WindowManager()
const backend = new Backend()

app.EXTENSION = {
    connect: (contentsId, config, clientId) => backend.connect(contentsId, config, clientId),
    inject: (contentsId, path, obj) => {
        webContents.fromId(contentsId).once('destroyed', () => {
            inject(app, path)
        })
        inject(app, path, obj)
    },
    createWindow: (config, options) => winMgr.create(config, options)
}

app.on('web-contents-created', (_, contents) => {
    contents.on('will-attach-webview', (__, webPreferences: WebPreferences) => {
        const hostWebPreferences = BrowserWindow.fromWebContents(contents).webContents.getWebPreferences()
        webPreferences.preloadURL = env.preload
        // derive host's partition
        webPreferences.partition = hostWebPreferences.partition
        webPreferences.xargs = {
            clientId: [...hostWebPreferences.xargs!.clientId!, 'webview-' + contents.id],
            // derive host's site config
            config: hostWebPreferences.xargs!.config
        }

    }).on('did-attach-webview', (__, wc) => {
        // for all webview
        contextMenu({ window: wc })
    })
}).once('ready', () => {
    setupMenu()

    winMgr.initXWorker().webContents.once('did-finish-load', () => {
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
