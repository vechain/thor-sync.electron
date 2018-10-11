import * as connex from '@/connex'
import { app, webContents } from 'electron'
import { Agent } from 'http'
import { Site } from '@/main/site'
// tslint:disable:no-console

export class Backend {
    private activeSites = new Map<string, { site: Site, refCount: number }>()

    public connect(
        contentsId: number,
        config: Connex.Thor.Site.Config,
        clientId: string[]
    ) {
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

        return connex.create(site, {
            name: 'thor-sync',
            sign: (kind, message, options) => {
                if (kind === 'tx') {
                    return app.uix[clientId[0]].signTx(
                        clientId,
                        message,
                        options)
                }
                throw new Error('not implemented')
            }
        })
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
