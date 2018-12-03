import { app, webContents, BrowserWindow } from 'electron'
import { Agent } from 'http'
import { create as createThor, Site } from '../thor'
import TxQueue from './tx-queue'

export class Backend {
    private readonly activeSites = new Map<string, { site: Site, refCount: number }>()
    private readonly txQueue = new TxQueue()

    public connect(
        contentsId: number,
        config: Thor.SiteConfig
    ): { connex: Connex, txer: Txer } {
        const wireAgent = new Agent({
            maxSockets: 10
        })
        const site = this.acquireSite(config).withWireAgent(wireAgent)
        // tslint:disable-next-line:no-console
        console.log('connex connected')

        const contents = webContents.fromId(contentsId)
        const disconnect = () => {
            contents.removeListener('did-start-loading', disconnect)
            contents.removeListener('crashed', disconnect)
            contents.removeListener('destroyed', disconnect)

            wireAgent.destroy()
            // tslint:disable-next-line:no-console
            console.log('connex disconnected')
            this.releaseSite(config)
        }
        contents.once('did-start-loading', disconnect)
        contents.once('crashed', disconnect)
        contents.once('destroyed', disconnect)

        const windowId = BrowserWindow.fromWebContents(contents.hostWebContents || contents).id

        const txQueueWire = site.withWireAgent(new Agent({ maxSockets: 10 })).createWire()
        return {
            connex: {
                thor: createThor(site),
                vendor: {
                    sign: kind => {
                        if (kind === 'tx') {
                            let txMsg: Connex.Vendor.SigningService.Message<'tx'>
                            const service: Connex.Vendor.SigningService<'tx'> = {
                                message: msg => {
                                    txMsg = msg
                                    return service
                                },
                                request: opts => {
                                    return app.vendor[windowId].signTx(
                                        contentsId,
                                        txMsg,
                                        opts || {},
                                        { url: contents.getURL(), title: contents.getTitle() }
                                    )
                                }
                            }
                            return service as any
                        }
                        throw new Error('unsupported')
                    }
                }
            },
            txer: {
                send: (id, raw) => {
                    this.txQueue.enqueue(id, raw, txQueueWire)
                },
                status: id => {
                    return this.txQueue.status(id)
                }
            }
        }
    }

    private siteKey(config: Thor.SiteConfig) {
        return config.genesis.id + '@' + config.url
    }
    private acquireSite(config: Thor.SiteConfig) {
        const key = this.siteKey(config)
        let value = this.activeSites.get(key)
        if (value) {
            value.refCount++
            // tslint:disable-next-line:no-console
            console.log(`acquireSite: <${key}> #${value.refCount}`)
        } else {
            value = {
                site: new Site(config),
                refCount: 1
            }
            this.activeSites.set(key, value)
            // tslint:disable-next-line:no-console
            console.log(`acquireSite: <${key}> site created`)
        }
        return value.site
    }

    private releaseSite(config: Thor.SiteConfig) {
        const key = this.siteKey(config)
        const value = this.activeSites.get(key)
        if (value) {
            value.refCount--
            // tslint:disable-next-line:no-console
            console.log(`releaseSite: <${key}> #${value.refCount}`)
            if (value.refCount === 0) {
                value.site.shutdown()
                this.activeSites.delete(key)
                // tslint:disable-next-line:no-console
                console.log(`releaseSite: <${key}> site destroyed`)
            }
        } else {
            // tslint:disable-next-line:no-console
            console.warn(`releaseSite: <${key}> found`)
        }
    }
}
