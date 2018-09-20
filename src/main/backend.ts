import * as connex from '@/connex'
import { webContents } from 'electron'
import { Agent } from 'http'
import { Site } from '@/main/site'

export class Backend {
    private activeConfigs: { [wcId: number]: SiteConfig } = {}
    private activeSites: { [index: string]: Site } = {}
    private activeConns: { [wcId: number]: Agent } = {}

    public bindSiteConfig(webContentsId: number, config: SiteConfig) {
        const wc = webContents.fromId(webContentsId)
        if (!wc) {
            throw new Error('failed to get webContents instance')
        }
        if (this.activeConfigs[webContentsId]) {
            throw new Error('host already registered')
        }
        this.activeConfigs[webContentsId] = config
        wc.once('destroyed', () => {
            delete this.activeConfigs[webContentsId]
        })
    }

    public getSiteConfig(webContentsId: number): SiteConfig | undefined {
        const config = this.activeConfigs[webContentsId]
        if (config) {
            return config
        }
        const wc = webContents.fromId(webContentsId)
        if (wc && wc.hostWebContents) {
            return this.activeConfigs[wc.hostWebContents.id]
        }
    }

    public connect(webContentsId: number, userAddr?: string): Connex {
        const config = this.getSiteConfig(webContentsId)
        if (!config) {
            throw new Error('host not registered')
        }

        const siteKey = config.genesis + '@' + config.url
        let site = this.activeSites[siteKey]
        if (!site) {
            site = new Site(config.url, config.genesis)
            this.activeSites[siteKey] = site
        }

        let conn = this.activeConns[webContentsId]
        if (conn) {
            conn.destroy()
        }
        conn = new Agent({
            maxSockets: 20
        })
        this.activeConns[webContentsId] = conn

        webContents.fromId(webContentsId).once('destroyed', () => {
            const remained = this.activeConns[webContentsId]
            if (remained) {
                remained.destroy()
                delete this.activeConns[webContentsId]
            }
        })

        return connex.create(
            userAddr
                ? {
                      address: userAddr,
                      sign: (kind, clauses) => {
                          let clausesStr = JSON.stringify(clauses)
                          return webContents
                              .fromId(webContentsId)
                              .hostWebContents.executeJavaScript(
                                  `uix.sign('${userAddr}', '${clausesStr}')`
                              )
                          // throw new Error('not implemented')
                      }
                  }
                : undefined,
            site.withWireAgent(conn),
            {
                name: 'thor-sync'
            }
        )
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
