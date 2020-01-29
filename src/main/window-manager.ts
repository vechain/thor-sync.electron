import {
    app,
    BrowserWindowConstructorOptions,
    BrowserWindow,
    BrowserView,
    Menu,
} from 'electron'
import env from '@/env'
import { presets, nameOfNetwork } from '../node-configs'
import { parseExternalUrl } from '@/common/url-utils'
import { buildContextMenu } from '@/common/context-menu'

const defaultWindowOptions: BrowserWindowConstructorOptions = {
    height: 700,
    useContentSize: true,
    width: 1000,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#fafafa',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    frame: process.platform === 'darwin',
    webPreferences: {
        nodeIntegration: true,
        webviewTag: true
    }
}

class WindowManager {
    private readonly actives: Array<{ win: BrowserWindow, events: Set<string> }> = []
    private xWorkerView?: BrowserView
    private about?: BrowserWindow

    public create(
        config?: NodeConfig,
        options?: BrowserWindowConstructorOptions
    ) {
        config = config || (() =>
            presets.find(n => nameOfNetwork(n.genesis.id) === (env.devMode ? 'test' : 'main'))!
        )()
        options = { ...defaultWindowOptions, ...(options || {}) }
        options.webPreferences = options.webPreferences || { navigateOnDragDrop: false }
        options.webPreferences.partition = `persist:${env.devMode ? 'dev' : 'pro'}`

        if (app.EXTENSION.mainSettings.get('dark-theme')) {
            options.backgroundColor = '#303030'
        }
        options.webPreferences.nodeConfig = config
        if (!options.title) {
            options.title = `${nameOfNetwork(config.genesis.id).toUpperCase()}:${config.name}`
        }

        const win = new BrowserWindow(options)
        win.setMenu(null) // to disable default accelerators
        win.loadURL(env.index)

        this.actives.push({ win, events: new Set() })
        const windowId = win.id

        win.once('closed', () => {
            const i = this.actives.findIndex(e => e.win === win)
            if (i >= 0) {
                this.actives.splice(i, 1)
            }
            win.removeAllListeners()
            if (this.activeCount === 0) {
                if (this.about) {
                    this.about.close()
                }
            }
        })
        win.webContents.on('context-menu', (ev, props) => {
            const { sender } = ev as Electron.Event & { sender: Electron.WebContents }
            const items = buildContextMenu(sender, props)
            if (items.length > 0) {
                Menu.buildFromTemplate(items).popup({})
            }
        })
        this.initXWorker()
        return win
    }
    public get activeCount() {
        return this.actives.length
    }

    public showAbout() {
        if (this.about) {
            return
        }
        const win = new BrowserWindow({
            center: true,
            useContentSize: true,
            width: 300,
            height: 300,
            resizable: false,
            closable: true,
            maximizable: false,
            minimizable: false,
            webPreferences: {
                nodeIntegration: true,
                webviewTag: true
            }
        })
        win.setMenu(null)
        win.loadURL(env.about)
        this.about = win
        win.once('closed', () => {
            this.about = undefined
        })
    }

    public closeAll() {
        const actives = [...this.actives]
        actives.forEach(i => i.win.close())
    }

    public registerWindowEvent(id: number, events: string[]) {
        const entry = this.actives.find(a => a.win.id === id)
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
    public focus() {
        if (process.platform === 'darwin') {
            app.focus()
        } else {
            if (this.activeCount > 0) {
                const win = this.actives[0].win
                if (win.isMinimizable()) {
                    win.restore()
                }
                win.focus()
            }
        }
    }

    public openUrl(externalUrl: string) {
        const parsed = parseExternalUrl(externalUrl)
        if (!parsed) {
            return false
        }
        let target: BrowserWindow | undefined
        const config = presets.find(p => nameOfNetwork(p.genesis.id) === parsed.network)
        if (config) {
            for (const entry of this.actives) {
                const win = entry.win
                if (win.webContents.getWebPreferences().nodeConfig!.genesis.id
                    === config.genesis.id) {
                    target = win
                    break
                }
            }
        } else {
            if (this.actives.length > 0) {
                target = this.actives[0].win
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

    private initXWorker() {
        if (this.xWorkerView) {
            return
        }

        this.xWorkerView = new BrowserView()
        this.xWorkerView.webContents.loadURL(env.xWorker)
    }
}

export default WindowManager
