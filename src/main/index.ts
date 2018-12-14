import { app, webContents, CertificateVerifyProcRequest } from 'electron'
import { Backend } from './backend'
import { setupMenu } from './menu'
import WindowManager from './window-manager'
import inject from './inject'
import { discoverNode } from './node'

// tslint:disable-next-line:no-var-requires
require('electron-unhandled')({
    //    logger: console.error,
    showDialog: false
})

app.setName('Sync')

// tslint:disable-next-line:no-var-requires
const contextMenu = require('electron-context-menu')
// for all browserWindow
contextMenu()

declare module 'electron' {
    interface App {
        EXTENSION: {
            connect(
                contentsId: number,
                config: NodeConfig
            ): { connex: Connex, txer: Txer }

            inject(
                contentsId: number,
                path: string,
                obj: {
                    [prop: string]: (...args: any[]) => void
                }): void

            createWindow(
                config?: NodeConfig,
                options?: BrowserWindowConstructorOptions
            ): BrowserWindow
            getCertificate(hostname: string): CertificateVerifyProcRequest | undefined

            registerBrowserWindowEvent(windowId: number, event: string[]): void

            // discover node's thorest api and return discovered genesis block.
            discoverNode(url: string): Promise<Connex.Thor.Block>
        }
    }
}

const winMgr = new WindowManager()
const backend = new Backend()
const certs = new Map<string, CertificateVerifyProcRequest>()

const certVerifyProc = (req: CertificateVerifyProcRequest, callback: (verificationResult: number) => void) => {
    certs.set(req.hostname, req)
    if (req.verificationResult === 'net::OK') {
        callback(0)
    } else {
        callback(-3)
    }
}


app.EXTENSION = {
    connect: (contentsId, config) => backend.connect(contentsId, config),
    inject: (contentsId, path, obj) => {
        webContents.fromId(contentsId).once('destroyed', () => {
            inject(app, path)
        })
        inject(app, path, obj)
    },
    createWindow: (config, options) => winMgr.create(config, options),
    getCertificate: (hostname) => certs.get(hostname),
    registerBrowserWindowEvent: (windowId, events) => { winMgr.registerWindowEvent(windowId, events) },
    discoverNode: url => discoverNode(url)
}

app.on('web-contents-created', (_, contents) => {
    contents.on('did-attach-webview', (__, wc) => {
        wc.session.setCertificateVerifyProc(certVerifyProc)
        // for all webview
        contextMenu({
            window: wc,
            showInspectElement: true
        })
    })
}).once('ready', () => {
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
