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

        inject(name: string, obj?: {
            // last arg must be callback
            [prop: string]: (...args: any[]) => void
        }): void

        createWindow(
            siteConfig?: SiteConfig,
            options?: BrowserWindowConstructorOptions
        ): BrowserWindow
    }
}

const winMgr = new WindowManager()

app.backend = new Backend()
app.inject = (name, obj) => {
    if (obj) {
        const injects = {} as any
        // tslint:disable-next-line:forin
        for (const key in obj) {
            const fn = obj[key]
            injects[key] = (...args: any[]) => {
                return new Promise<any>((resolve, reject) => {
                    fn(...args, (err: any, result: any) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(result)
                    })
                })
            }
        }
        (app as any)[name] = injects
    } else {
        delete (app as any)[name]
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
