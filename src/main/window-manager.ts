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
    private readonly actives = new Map<number, { win: BrowserWindow, events: Set<string> }>()
    private xWorkerWin?: BrowserWindow

    public create(
        config?: Thor.Site.Config,
        options?: BrowserWindowConstructorOptions
    ) {
        options = { ...defaultWindowOptions, ...(options || {}) }
        options.webPreferences = options.webPreferences || {}
        // options.webPreferences.partition = 'persist:' + config.genesis.id
        options.webPreferences.siteConfig = config || siteConfigs[0]

        if (!options.title) {
            options.title = `Sync @${options.webPreferences.siteConfig.name}`
        }

        const win = new BrowserWindow(options)

        const id = win.id
        this.actives.set(id, { win, events: new Set() })

        win.once('closed', () => {
            this.actives.delete(id)
            win.removeAllListeners()
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

    public registerWindowEvent(id: number, events: string[]) {
        const entry = this.actives.get(id)
        if (entry) {
            events.forEach(event => {
                if (!entry.events.has(event)) {
                    entry.events.add(event)
                    entry.win.on(event as any, () => entry.win.webContents.send('browser-window-event', event))
                }
            })
        }
    }
}

export default WindowManager
