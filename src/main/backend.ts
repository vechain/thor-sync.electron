import { app, webContents } from 'electron'
import { Agent } from 'http'
import { Site } from '@/main/site'
import { create as createThor } from '../thor'
// tslint:disable:no-console

export class Backend {
    private activeSites = new Map<string, { site: Site, refCount: number }>()

    public connect(
        contentsId: number,
        config: Connex.Thor.Site.Config,
        clientId: string[]
    ): Connex {
        const wireAgent = new Agent({
            maxSockets: 10
        })
        const site = this.acquireSite(config).withWireAgent(wireAgent)
        console.log('connex connected')

        const contents = webContents.fromId(contentsId)
        const disconnect = () => {
            contents.removeListener('devtools-reload-page', disconnect)
            contents.removeListener('crashed', disconnect)
            contents.removeListener('destroyed', disconnect)

            wireAgent.destroy()
            console.log('connex disconnected')
            this.releaseSite(config)
        }

        contents.once('devtools-reload-page', disconnect)
        contents.once('crashed', disconnect)
        contents.once('destroyed', disconnect)

        const wire = site.createWire()
        return {
            thor: createThor(site),
            vendor: {
                name: 'thor-sync',
                sign: (kind, message, options) => {
                    if (kind === 'tx') {
                        return app.vendor[clientId[0]].signTx(
                            clientId,
                            message,
                            options) as any
                    }
                    throw new Error('not implemented')
                }
            },
            commitTx(raw) {
                return wire.post<{ id: string }>(
                    'transactions',
                    { raw }
                ).then(r => r.id)
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
            console.log(`acquireSite: <${key}> #${value.refCount}`)
        } else {
            value = {
                site: new Site(config),
                refCount: 1
            }
            this.activeSites.set(key, value)
            console.log(`acquireSite: <${key}> site created`)
        }
        return value.site
    }

    private releaseSite(config: Connex.Thor.Site.Config) {
        const key = this.siteKey(config)
        const value = this.activeSites.get(key)
        if (value) {
            value.refCount--
            console.log(`releaseSite: <${key}> #${value.refCount}`)
            if (value.refCount === 0) {
                this.activeSites.delete(key)
                console.log(`releaseSite: <${key}> site destroyed`)
            }
        } else {
            console.warn(`releaseSite: <${key}> found`)
        }
    }
}
