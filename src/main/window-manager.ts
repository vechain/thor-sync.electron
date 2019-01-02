import { app, BrowserWindowConstructorOptions, BrowserWindow, BrowserView } from 'electron'
import env from '@/env'
import { presets, nameOfNetwork } from '../node-configs'
import { parseDappUrl } from '@/common/url-utils'

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
        config?: NodeConfig,
        options?: BrowserWindowConstructorOptions
    ) {
        config = config || (() =>
            presets.find(n => nameOfNetwork(n.genesis.id) === (env.devMode ? 'testnet' : 'mainnet'))!
        )()
        options = { ...defaultWindowOptions, ...(options || {}) }
        options.webPreferences = options.webPreferences || { navigateOnDragDrop: false }
        // options.webPreferences.partition = 'persist:' + config.genesis.id

        options.webPreferences.nodeConfig = config
        if (!options.title) {
            options.title = `Sync - ${nameOfNetwork(config.genesis.id)}:${config.name}`
        }

        const win = new BrowserWindow(options)
        this.attachLaunchScreen(win)

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
        })
        win.webContents.once('did-stop-loading', () => {
            const bw = win.getBrowserView()
            if (bw && !bw.isDestroyed()) {
                bw.setAutoResize({ width: false, height: false })
                bw.setBounds({ x: 0, y: 0, width: 0, height: 0 })
                bw.destroy()
            }
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

    public dispatchDbEvent(event: DbEvent) {
        this.actives
            .forEach(entry => entry.win.webContents.send('db-event', event))
    }

    public openDapp(dappUrl: string) {
        const parsed = parseDappUrl(dappUrl)
        if (!parsed) {
            return false
        }
        const config = presets.find(p => nameOfNetwork(p.genesis.id) === parsed.network) || presets[0]
        let target: BrowserWindow | undefined
        for (const entry of this.actives) {
            const win = entry[1].win
            if (win.webContents.getWebPreferences().nodeConfig!.genesis.id
                === config.genesis.id) {
                target = win
                break
            }
        }
        if (target) {
            target.focus()
        } else {
            target = this.create(config)
        }
        const action: TabAction = {
            action: 'new',
            url: parsed.url
        }
        app.EXTENSION.mq.post(`TabAction-${target.id}`, action)
        return true
    }

    private attachLaunchScreen(win: BrowserWindow) {
        const view = new BrowserView({
            webPreferences: {
                nodeIntegration: false
            }
        })
        win.setBrowserView(view)
        const contentSize = win.getContentSize()
        view.setBounds({
            x: 0, y: 0,
            width: contentSize[0], height: contentSize[1]
        })
        view.setAutoResize({ width: true, height: true })
        view.webContents.loadURL(env.launchScreen)
        win.setBrowserView(view)
        view.webContents.once('dom-ready', () => {
            win.show()
        })
    }
}

export default WindowManager
