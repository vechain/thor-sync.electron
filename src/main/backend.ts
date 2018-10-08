import * as connex from '@/connex'
import { webContents, app } from 'electron'
import { Agent } from 'http'
import { Site } from '@/main/site'

export class Backend {
    private activeConfigs = new Map<number, SiteConfig>()
    private activeSites = new Map<string, Site>()
    private activeConns = new Map<number, Agent>()

    public bindSiteConfig(webContentsId: number, config: SiteConfig) {
        const wc = webContents.fromId(webContentsId)
        if (!wc) {
            throw new Error('failed to get webContents instance')
        }
        if (this.activeConfigs.get(webContentsId)) {
            throw new Error('host already registered')
        }
        this.activeConfigs.set(webContentsId, config)
        wc.once('destroyed', () => {
            this.activeConfigs.delete(webContentsId)
        })
    }

    public getSiteConfig(webContentsId: number) {
        const config = this.activeConfigs.get(webContentsId)
        if (config) {
            return config
        }
        const wc = webContents.fromId(webContentsId)
        if (wc && wc.hostWebContents) {
            return this.activeConfigs.get(wc.hostWebContents.id)
        }
    }

    public connect(webContentsId: number, userAddr?: string): Connex {
        const wc = webContents.fromId(webContentsId)
        if (!wc) {
            throw new Error('no such webContents')
        }
        const config = this.getSiteConfig(webContentsId)
        if (!config) {
            throw new Error('host not registered')
        }

        const siteKey = config.genesis + '@' + config.url
        let site = this.activeSites.get(siteKey)
        if (!site) {
            site = new Site(config.url, config.genesis)
            this.activeSites.set(siteKey, site)
        }

        let conn = this.activeConns.get(webContentsId)
        if (conn) {
            conn.destroy()
        }
        conn = new Agent({
            maxSockets: 20
        })
        this.activeConns.set(webContentsId, conn)
        wc.once('destroyed', () => {
            const remained = this.activeConns.get(webContentsId)
            if (remained) {
                remained.destroy()
                this.activeConns.delete(webContentsId)
            }
        })

        let user: Connex.User | undefined
        if (userAddr) {
            user = {
                address: userAddr,
                sign: (kind, clauses) => {
                    if (kind === 'tx') {
                        return app.uix[(wc.hostWebContents || wc).id].signTx(userAddr, clauses)
                    }
                    throw new Error('not implemented')
                }
            }
        }

        return connex.create(
            user,
            site.withWireAgent(conn),
            {
                name: 'thor-sync'
            })
    }

    public get siteConfigs() {
        return siteConfigs
    }
}

export type SiteConfig = {
    name: string
    url: string
    genesis: Connex.Thor.Block
}

const siteConfigs: SiteConfig[] = [
    {
        name: 'Testnet',
        url: 'http://localhost:8669',
        genesis: {
            number: 0,
            id:
                '0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127',
            size: 170,
            parentID:
                '0xffffffff00000000000000000000000000000000000000000000000000000000',
            timestamp: 1530014400,
            gasLimit: 10000000,
            beneficiary: '0x0000000000000000000000000000000000000000',
            gasUsed: 0,
            totalScore: 0,
            txsRoot:
                '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
            stateRoot:
                '0x4ec3af0acbad1ae467ad569337d2fe8576fe303928d35b8cdd91de47e9ac84bb',
            receiptsRoot:
                '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
            signer: '0x0000000000000000000000000000000000000000',
            transactions: []
        }
    },
    {
        name: 'Mainnet',
        url: 'http://localhost:8669',
        genesis: {
            number: 0,
            id:
                '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a',
            size: 170,
            parentID:
                '0xffffffff53616c757465202620526573706563742c20457468657265756d2100',
            timestamp: 1530316800,
            gasLimit: 10000000,
            beneficiary: '0x0000000000000000000000000000000000000000',
            gasUsed: 0,
            totalScore: 0,
            txsRoot:
                '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
            stateRoot:
                '0x09bfdf9e24dd5cd5b63f3c1b5d58b97ff02ca0490214a021ed7d99b93867839c',
            receiptsRoot:
                '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
            signer: '0x0000000000000000000000000000000000000000',
            transactions: []
        }
    }
]
