import { DriverNoVendor } from '@vechain/connex.driver-nodejs/dist/driver-no-vendor'
import { remote } from 'electron'
import { ipcServe, ipcCall } from '../ipc'
import { SimpleNet } from '@vechain/connex.driver-nodejs/dist/simple-net'
import { blake2b256 } from 'thor-devkit/dist/cry/blake2b'
import { Throttle } from './throttle'

export class Driver extends DriverNoVendor {
    private readonly configId: string
    constructor() {

        const configId = blake2b256(JSON.stringify(NODE_CONFIG)).toString('hex')
        const knownHead = remote.app.EXTENSION.knownHeads.get(configId)
        super(
            new SimpleNet(NODE_CONFIG.url, 30 * 1000),
            NODE_CONFIG.genesis,
            knownHead)
        this.configId = configId
        this.serveForApp()
    }

    public pollHead() {
        return this._pollHead().then(h => {
            remote.app.EXTENSION.knownHeads.set(this.configId, h)
            return h
        })
    }
    public _pollHead() {
        return super.pollHead()
    }
    public signTx(
        msg: Connex.Driver.SignTxArg,
        option: Connex.Driver.SignTxOption
    ): Promise<Connex.Driver.SignTxResult> {
        if (!window.VENDOR) {
            throw new Error('not ready')
        }
        const wc = remote.getCurrentWebContents()
        return window.VENDOR.signTx(msg, option, {
            webContentsId: wc.id,
            referer: {
                title: wc.getTitle(),
                url: wc.getURL()
            }
        })
    }
    public signCert(
        msg: Connex.Vendor.CertMessage,
        options: Connex.Driver.SignCertOption
    ): Promise<Connex.Vendor.CertResponse> {
        if (!window.VENDOR) {
            throw new Error('not ready')
        }
        const wc = remote.getCurrentWebContents()
        return window.VENDOR.signCert(msg, options, {
            webContentsId: wc.id,
            referer: {
                title: wc.getTitle(),
                url: wc.getURL()
            }
        })
    }
    public isAddressOwned(addr: string): boolean {
        if (!window.VENDOR) {
            throw new Error('not ready')
        }
        return window.VENDOR.isAddressOwned(addr)
    }

    private serveForApp() {
        const throttleMap = new Map<number, Throttle>()
        ipcServe('driver', async (fromWebContentsId, method, args) => {
            try {
                const wc = remote.webContents.fromId(fromWebContentsId)
                const fn = (this as any)[method]
                if (fn instanceof Function) {
                    if (method === 'signTx') {
                        if (!window.VENDOR) {
                            throw new Error('not ready')
                        }
                        let delegationHandler
                        if (args[2]) {
                            delegationHandler = (arg: any) => {
                                return ipcCall({
                                    webContentsId: fromWebContentsId,
                                    channel: args[2]
                                }, '', arg)
                            }
                        }
                        return await window.VENDOR.signTx(
                            args[0],
                            { ...args[1], delegationHandler },
                            {
                                webContentsId: fromWebContentsId,
                                referer: {
                                    title: wc.getTitle(),
                                    url: wc.getURL()
                                }
                            })
                    } else if (method === 'signCert') {
                        if (!window.VENDOR) {
                            throw new Error('not ready')
                        }
                        return await window.VENDOR.signCert(args[0], args[1], {
                            webContentsId: wc.id,
                            referer: {
                                title: wc.getTitle(),
                                url: wc.getURL()
                            }
                        })
                    } else if (method === 'pollHead') {
                        return await this._pollHead()
                    } else {
                        let th = throttleMap.get(fromWebContentsId)
                        if (!th) {
                            th = new Throttle(15, 200)
                            throttleMap.set(fromWebContentsId, th)
                            wc.once('destroyed', () => {
                                throttleMap.delete(fromWebContentsId)
                            })
                        }
                        const r = th.throttle(() => fn.apply(this, args))
                        if (th.concurrent >= th.softLimit && th.concurrent < th.hardLimit) {
                            wc.executeJavaScript(
                                `console.warn('connex: request pending (concurrent soft limit ${th.softLimit})')`)
                                // tslint:disable-next-line: no-console
                                .catch(err => console.warn('log to webview', err))
                        }
                        return await r
                    }
                }
                throw { name: 'Error', message: 'not impl' }
            } catch (err) {
                // it's important to transform error into plain object,
                // since electron's ipc will json/unjson arguments
                throw { name: err.name, message: err.message }
            }
        })
    }
}

