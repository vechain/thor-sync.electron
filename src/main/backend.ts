import { app, webContents } from 'electron'
import { Agent } from 'http'
import { Site } from '@/main/site'
import { create as createThor } from '../thor'
import TxQueue from './tx-queue'

export class Backend {
    private readonly activeSites = new Map<string, { site: Site, refCount: number }>()
    private readonly txQueue = new TxQueue()

    public connect(
        contentsId: number,
        config: Connex.Thor.Site.Config,
        clientId: string[]
    ): Connex {
        const wireAgent = new Agent({
            maxSockets: 10
        })
        const site = this.acquireSite(config).withWireAgent(wireAgent)
        // tslint:disable-next-line:no-console
        console.log('connex connected')

        const contents = webContents.fromId(contentsId)
        const disconnect = () => {
            contents.removeListener('devtools-reload-page', disconnect)
            contents.removeListener('crashed', disconnect)
            contents.removeListener('destroyed', disconnect)

            wireAgent.destroy()
            // tslint:disable-next-line:no-console
            console.log('connex disconnected')
            this.releaseSite(config)
        }

        contents.once('devtools-reload-page', disconnect)
        contents.once('crashed', disconnect)
        contents.once('destroyed', disconnect)

        const txQueueWire = site.withWireAgent(new Agent({ maxSockets: 10 })).createWire()
        return {
            thor: createThor(site),
            vendor: {
                name: 'thor-sync',
                sign: (kind, message, options) => {
                    if (kind === 'tx') {
                        return app.vendor[clientId[0]].signTx(
                            clientId,
                            message,
                            options || {},
                            { url: contents.getURL(), title: contents.getTitle() }
                        ) as any
                    }
                    throw new Error('not implemented')
                }
            },
            txQueue: {
                send: (id, raw) => {
                    this.txQueue.enqueue(id, raw, txQueueWire)
                },
                status: id => {
                    return this.txQueue.status(id)
                }
            }
        }
    }

    private siteKey(config: Connex.Thor.Site.Config) {
        return config.genesis.id + '@' + config.url
    }
    private acquireSite(config: Connex.Thor.Site.Config) {
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

    private releaseSite(config: Connex.Thor.Site.Config) {
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
