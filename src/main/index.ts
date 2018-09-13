import { app, BrowserWindow, } from 'electron'
import { Backend, SiteConfig } from './backend'
import { setupMenu } from './menu'
import { createWindow } from './window'

declare module 'electron' {
    interface App {
        backend: Backend
        createWindow(
            siteConfig?: SiteConfig,
            options?: BrowserWindowConstructorOptions): BrowserWindow
    }
}

app.backend = new Backend()
app.createWindow = createWindow

app.once('ready', () => {
    setupMenu()
    createWindow()
}).on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
}).on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
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

