import { app } from 'electron'
import { Backend, SiteConfig } from './backend'
import { setupMenu } from './menu'
import WindowManager from './window-manager'
import { promisify } from 'util'

// tslint:disable-next-line:no-var-requires
require('electron-unhandled')({
    //    logger: console.error,
    showDialog: false
})

type StdCallback<R> = (err?: Error, result?: R) => void
type Promisifiable<R, T1 = never, T2 = never, T3 = never, T4 = never> =
    ((arg1: T1, callback: StdCallback<R>) => void) |
    ((arg1: T1, arg2: T2, callback: StdCallback<R>) => void) |
    ((arg1: T1, arg2: T2, arg3: T3, callback: StdCallback<R>) => void) |
    ((arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: StdCallback<R>) => void)

declare module 'electron' {
    interface App {
        backend: Backend

        inject(path: string, obj?: {
            [prop: string]: Promisifiable<any>
        }): void

        createWindow(
            siteConfig?: SiteConfig,
            options?: BrowserWindowConstructorOptions
        ): BrowserWindow
    }
}

const winMgr = new WindowManager()

app.backend = new Backend()
app.inject = (path, obj) => {
    const paths = path.split('.')
    let dest = app as any
    for (let i = 0; i < paths.length - 1; i++) {
        if (dest[paths[i]]) {
            dest = dest[paths[i]]
        } else {
            dest = dest[paths[i]] = {}
        }
    }
    if (obj) {
        const injects = {} as any
        // tslint:disable-next-line:forin
        for (const key in obj) {
            injects[key] = promisify(obj[key])
        }
        dest[paths[paths.length - 1]] = injects
    } else {
        delete dest[paths[paths.length - 1]]
    }
}

app.createWindow = (siteConfig, options) => winMgr.create(siteConfig, options)

app.once('ready', () => {
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
