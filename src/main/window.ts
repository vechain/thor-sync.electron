import { app, BrowserWindowConstructorOptions, BrowserWindow } from 'electron'
import { SiteConfig } from './backend'
import env from '@/env'

const activeWindows: { [index: number]: BrowserWindow } = {}
const defaultWindowOptions: BrowserWindowConstructorOptions = {
    height: 600,
    useContentSize: true,
    show: false,
    width: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined
}

export function createWindow(
    siteConfig?: SiteConfig,
    options?: BrowserWindowConstructorOptions
): BrowserWindow {
    options = { ...defaultWindowOptions, ...(options || {}) }
    const win = new BrowserWindow(options)

    const id = win.id
    activeWindows[id] = win

    win.once('closed', () => {
        delete activeWindows[id]
    }).once('ready-to-show', () => {
        win.show()
    })
    app.backend.bindSiteConfig(win.webContents.id, siteConfig || app.backend.siteConfigs[0])
    win.loadURL(env.index)
    return win
}
