import * as connex from '@/connex'
import { app, webContents } from 'electron'
import { Agent } from 'http'
import { Site } from '@/main/site'
// tslint:disable:no-console

export class Backend {
    private activeSites = new Map<string, { site: Site, refCount: number }>()

    public connect(
        config: Connex.Thor.Site.Config,
        fullClientId: string,
        contentsId: number
    ) {
        const wireAgent = new Agent({
            maxSockets: 10
        })
        const site = this.acquireSite(config).withWireAgent(wireAgent)
        const segments = fullClientId.split('.')

        console.log('connex connected')

        webContents.fromId(contentsId).once('destroyed', () => {
            wireAgent.destroy()
            console.log('connex disconnected')
            this.releaseSite(config)
        })

        return connex.create(site, {
            name: 'thor-sync',
            sign: (kind, message, options) => {
                if (kind === 'tx') {
                    return app.uix[segments[0]].signTx(
                        segments[1],
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
