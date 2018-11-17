import { app, BrowserWindowConstructorOptions, BrowserWindow } from 'electron'
import env from '@/env'
import siteConfigs from '../site-configs'

const defaultWindowOptions: BrowserWindowConstructorOptions = {
    height: 700,
    //    useContentSize: true,
    show: false,
    width: 1000,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined
}

class WindowManager {
    private readonly actives = new Map<number, BrowserWindow>()
    private xWorkerWin?: BrowserWindow

    public create(
        config?: Connex.Thor.Site.Config,
        options?: BrowserWindowConstructorOptions
    ) {
        options = { ...defaultWindowOptions, ...(options || {}) }
        options.webPreferences = options.webPreferences || {}
        // options.webPreferences.partition = 'persist:' + config.genesis.id
        options.webPreferences.siteConfig = config || siteConfigs[0]

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
