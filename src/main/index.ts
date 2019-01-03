import { app, CertificateVerifyProcRequest } from 'electron'
import { Backend } from './backend'
import { setupMenu } from './menu'
import WindowManager from './window-manager'
import { MQ } from './mq'
import env from '@/env'

declare module 'electron' {
    interface App {
        EXTENSION: {
            mq: MQ
            connect(
                contentsId: number,
                config: NodeConfig
            ): Client

            createWindow(
                config?: NodeConfig,
                options?: BrowserWindowConstructorOptions
            ): BrowserWindow
            getCertificate(hostname: string): CertificateVerifyProcRequest | undefined

            registerBrowserWindowEvent(windowId: number, event: string[]): void

            dispatchDbEvent(event: DbEvent): void
        }
    }
}


// tslint:disable-next-line:no-var-requires
require('electron-unhandled')({
    //    logger: console.error,
    showDialog: false
})

app.setName('Sync')

if (env.devMode || app.requestSingleInstanceLock()) {

    if (!env.devMode) {
        if (!app.isDefaultProtocolClient('vechain-app')) {
            app.setAsDefaultProtocolClient('vechain-app')
        }
    }

    // tslint:disable-next-line:no-var-requires
    const contextMenu = require('electron-context-menu')
    // for all browserWindow
    contextMenu()

    const mq = new MQ()
    const winMgr = new WindowManager()
    const backend = new Backend()
    const certs = new Map<string, CertificateVerifyProcRequest>()

    let initDappUrl = (env.devMode ? '' : process.argv[1]) || ''

    const certVerifyProc = (req: CertificateVerifyProcRequest, callback: (verificationResult: number) => void) => {
        certs.set(req.hostname, req)
        if (req.verificationResult === 'net::OK') {
            callback(0)
        } else {
            callback(-3)
        }
    }

    app.EXTENSION = {
        mq,
        connect: (contentsId, config) => backend.connect(contentsId, config),
        createWindow: (config, options) => winMgr.create(config, options),
        getCertificate: (hostname) => certs.get(hostname),
        registerBrowserWindowEvent: (windowId, events) => { winMgr.registerWindowEvent(windowId, events) },
        dispatchDbEvent: event => winMgr.dispatchDbEvent(event)
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
    }).on('ready', () => {
        setupMenu()
        if (initDappUrl) {
            if (!winMgr.openDapp(initDappUrl)) {
                winMgr.create()
            }
        } else {
            winMgr.create()
        }
        winMgr.initXWorker()
    }).on('open-url', (ev, dappUrl) => {
        // TODO windows/linux
        ev.preventDefault()
        if (app.isReady()) {
            winMgr.openDapp(dappUrl)
        } else {
            initDappUrl = dappUrl
        }
    }).on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (winMgr.activeCount === 0) {
            winMgr.create()
        }
    }).on('second-instance', (ev, argv) => {
        const dappUrl = argv[1]
        if (dappUrl) {
            winMgr.openDapp(dappUrl)
        } else {
            app.focus()
        }
    })
} else {
    app.quit()
}

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
