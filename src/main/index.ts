import { app, ProcRequest, crashReporter, powerMonitor } from 'electron'
import { setupMenu } from './menu'
import WindowManager from './window-manager'
import { MQ } from './mq'
import env from '@/env'
import * as log from 'electron-log'
import { createUpdateChecker } from './update-checker'
import { Analytics } from './analytics'
import { Txer } from './txer'

// tslint:disable-next-line:no-var-requires
const settings = require('electron-settings')

class MainSettings {
    public has(key: string) {
        return settings.has(key) as boolean
    }
    public get(key: string) {
        return settings.get(key)
    }

    public set(key: string, value: any) {
        return settings.set(key, value)
    }
}

process.on('uncaughtException', err => {
    log.error('uncaught exception', err)
})

crashReporter.start({
    productName: 'Sync',
    companyName: 'vechain.org',
    submitURL: 'https://submit.backtrace.io/vechain/a14441c8b2c2405a70ee6c89822148856314a8fa920adf4d80876fa14864f9a7/minidump', // tslint:disable:max-line-length
    uploadToServer: process.env.NODE_ENV === 'production' ? true : false,
})

declare module 'electron' {
    interface App {
        EXTENSION: {
            mq: MQ
            // map window id to known head
            knownHeads: Map<string, Connex.Thor.Status['head']>
            txer: Txer

            mainSettings: MainSettings
            updateChecker: ReturnType<typeof createUpdateChecker>

            createWindow(
                config?: NodeConfig,
                options?: BrowserWindowConstructorOptions
            ): BrowserWindow
            showAbout(): void
            getCertificate(hostname: string): ProcRequest | undefined

            registerBrowserWindowEvent(windowId: number, event: string[]): void

            dispatchDbEvent(event: DbEvent): void
        }
    }
}

app.name = 'Sync'
if (env.devMode) {
    app.setPath('userData', app.getPath('userData') + '-dev')
}

if (env.devMode || app.requestSingleInstanceLock()) {

    if (!env.devMode) {
        if (!app.isDefaultProtocolClient('vechain-app')) {
            app.setAsDefaultProtocolClient('vechain-app')
        }
    }

    let analytics: Analytics | undefined

    const updateChecker = createUpdateChecker()
    const mq = new MQ()
    const winMgr = new WindowManager()
    const certs = new Map<string, ProcRequest>()

    let initExternalUrl = (env.devMode ? '' : process.argv[1]) || ''

    const certVerifyProc = (req: ProcRequest, callback: (verificationResult: number) => void) => {
        log.debug('Certificate request:', req.hostname, req.verificationResult)
        certs.set(req.hostname, req)
        if (req.verificationResult === 'net::OK') {
            callback(0)
        } else {
            callback(-3)
        }
    }

    app.EXTENSION = {
        mq,
        knownHeads: new Map(),
        txer: new Txer(),
        mainSettings: new MainSettings(),
        updateChecker,
        createWindow: (config, options) => winMgr.create(config, options),
        showAbout: () => winMgr.showAbout(),
        getCertificate: (hostname) => certs.get(hostname),
        registerBrowserWindowEvent: (windowId, events) => { winMgr.registerWindowEvent(windowId, events) },
        dispatchDbEvent: event => winMgr.dispatchDbEvent(event)
    }

    app.on('web-contents-created', (ev, contents) => {
        log.debug('App:', 'web-contents-created', `#${contents.id}`)
        if (!analytics) {
            analytics = new Analytics(contents.userAgent)
            analytics.startup()
        }
        contents.on('did-attach-webview', (_ev, wc) => {
            log.debug('WebContents:', 'did-attach-webview', `#${wc.id}`)
            wc.session.setCertificateVerifyProc(certVerifyProc)
        })
    }).on('ready', () => {
        log.debug('App:', 'ready')
        powerMonitor.on('suspend', () => {
            if (process.platform === 'win32') {
                winMgr.closeAll()
            }
        })
        setupMenu()
        if (initExternalUrl) {
            if (!winMgr.openUrl(initExternalUrl)) {
                winMgr.create()
            }
        } else {
            winMgr.create()
        }

        if (process.env.NODE_ENV === 'production') {
            updateChecker.check()
            setInterval(() => updateChecker.check(), 12 * 3600 * 1000)
        }
    }).on('open-url', (ev, externalUrl) => {
        log.debug('App:', 'open-url', externalUrl)
        ev.preventDefault()
        if (app.isReady()) {
            winMgr.openUrl(externalUrl)
        } else {
            initExternalUrl = externalUrl
        }
    }).on('activate', () => {
        log.debug('App', 'activate')
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (winMgr.activeCount === 0) {
            winMgr.create()
        }
    }).on('second-instance', (ev, argv) => {
        log.debug('App', 'second-instance', argv)
        const externalUrl = argv[1]
        if (externalUrl) {
            if (winMgr.openUrl(externalUrl)) {
                return
            }
        }
        winMgr.focus()
    }).on('window-all-closed', () => {
        log.debug('App', 'window-all-closed')
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
} else {
    app.quit()
}
