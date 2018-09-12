import { app, BrowserWindow } from 'electron'
import { init } from '@/base'
import { createWin } from '@/main/windows'
import { Backend, SiteConfig } from '@/main/backend'

declare module 'electron' {
    interface App {
        backend: Backend
        createNovaWindow(
            siteConfig: SiteConfig,
            options?: BrowserWindowConstructorOptions): BrowserWindow
    }
}

function start() {
    app.backend = new Backend()
    app.createNovaWindow = (siteConfig, options) => {
        const win = new BrowserWindow(options)
        app.backend.bindSiteConfig(win.webContents.id, siteConfig)
        return win
    }

    init.folder()
    // init.copyThor()
    app.on('ready', createWin)

    app.on('window-all-closed', () => {
        app.quit()
    })
}

start()
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

