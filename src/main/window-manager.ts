import { app, BrowserWindowConstructorOptions, BrowserWindow } from 'electron'
import { SiteConfig } from './backend'
import env from '@/env'

const defaultWindowOptions: BrowserWindowConstructorOptions = {
    height: 600,
    useContentSize: true,
    show: false,
    width: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined
}

class WindowManager {
    private readonly actives = new Map<number, BrowserWindow>()
    private xWorkerWin?: BrowserWindow

    public create(
        siteConfig?: SiteConfig,
        options?: BrowserWindowConstructorOptions
    ) {
        siteConfig = siteConfig || app.backend.siteConfigs[0]
        options = { ...defaultWindowOptions, ...(options || {}) }
        options.webPreferences = { ...(options.webPreferences || {}), partition: 'persist:' + siteConfig.genesis.id }
        const win = new BrowserWindow(options)

        const id = win.id
        this.actives.set(id, win)

        win.once('closed', () => {
            this.actives.delete(id)
            if (this.actives.size === 0) {
                if (process.platform !== 'darwin') {
                    app.quit()
                }
            }
        }).once('ready-to-show', () => {
            win.show()
        })
        app.backend.bindSiteConfig(win.webContents.id, siteConfig)
        win.loadURL(env.index)
        return win
    }
    public get activeCount() {
        return this.actives.size
    }

    public initXWorker() {
        if (this.xWorkerWin) {
            return this.xWorkerWin
        }
        const win = new BrowserWindow({
            width: 0,
            height: 0,
            show: false,
            webPreferences: {
                devTools: false
            }
        })
        win.loadURL(env.xWorker)
        this.xWorkerWin = win
        return win
    }
}

export default WindowManager
