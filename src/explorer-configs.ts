import { nameOfNetwork } from './node-configs'

const explorers = [
    {
        name: 'insight',
        testUrl: 'https://insight.vecha.in/#',
        url: 'https://insight.vecha.in/#',
        paths: {
            tx: '/txs/%s',
            block: '/blocks/%s',
            account: '/accounts/%s',
            transfer: '/accounts/%s/transfers',
            search: '/search?q=%s'
        }
    },
    {
        name: 'vechain-explorer',
        testUrl: 'https://explore-testnet.vechain.org',
        url: 'https://explore.vechain.org',
        paths: {
            tx: '/transactions/%s',
            block: '/blocks/%s',
            account: '/accounts/%s',
            transfer: '/accounts/%s/transfer',
            search: '/search?content=%s'
        }
    }
]

export function getExploreUrl(name: 'insight' | 'vechain-explorer', path: string, params: string) {
    const networkName = nameOfNetwork(NODE_CONFIG.genesis.id)
    const isMain = networkName === 'main'
    const isMustInsight = ['main', 'test'].indexOf(networkName) < 0
    let explorer: any
    if (isMustInsight) {
        explorer = explorers[0]
    } else {
        explorer = explorers.find(e => e.name === name)
    }
    const baseUrl = isMain ? explorer.url : explorer.testUrl
    const pathTemp: string = explorer.paths[path] as string

    if (pathTemp) {
        return baseUrl + pathTemp.replace('%s', params)
    } else {
        return ''
    }

}