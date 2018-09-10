import { create as createConnex, Network, Wire } from '@/connex'
import { webContents } from 'electron'
import { Agent } from 'http'

export class Backend {
    public currentEnv = defaultEnv
    private endpoints: { [index: number]: Endpoint } = {}

    public connect(webContentsId: number): Endpoint {
        let ep = this.endpoints[webContentsId]
        if (!ep) {
            ep = new Endpoint(this.currentEnv, webContentsId)
            this.endpoints[webContentsId] = ep
            console.log('Endpoint created', '#' + webContentsId)
            const wc = webContents.fromId(webContentsId)
            wc.once('destroyed', () => {
                ep.destroy()
                delete this.endpoints[webContentsId]
                console.log('Endpoint deleted', '#' + webContentsId)
            })
        }
        console.log('Endpoint connected', '#' + webContentsId)
        return ep
    }
}



type Environment = {
    user: string
    network: NetworkConfig
}

class Endpoint {
    private static networks: { [index: string]: NetworkInterface } = {}
    private network: NetworkInterface
    private agent?: Agent
    constructor(readonly env: Environment, readonly webContentsId: number) {
        const networkKey = env.network.genesis.id + env.network.url
        let network = Endpoint.networks[networkKey]
        if (!network) {
            const wire = new Wire(env.network.genesis.id, env.network.url)
            network = new Network(env.network.genesis, wire)
            Endpoint.networks[networkKey] = network
        }
        this.network = network
    }

    public createConnex() {
        if (this.agent) {
            this.agent.destroy()
        }

        this.agent = new Agent({
            maxSockets: 20
        })

        const wire = new Wire(this.env.network.genesis.id, this.env.network.url, this.agent)
        return createConnex(this.env.user, {} as any, wire, this.network)
    }

    public destroy() {
        if (this.agent) {
            this.agent.destroy()
            this.agent = undefined
        }
    }
}

type NetworkConfig = {
    url: string
    genesis: Connex.Thor.Block
}

const networkConfigs: NetworkConfig[] = [
    {
        url: 'http://localhost:8669',
        genesis: {
            number: 0,
            id: '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a',
            size: 170,
            parentID: '0xffffffff53616c757465202620526573706563742c20457468657265756d2100',
            timestamp: 1530316800,
            gasLimit: 10000000,
            beneficiary: '0x0000000000000000000000000000000000000000',
            gasUsed: 0,
            totalScore: 0,
            txsRoot: '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
            stateRoot: '0x09bfdf9e24dd5cd5b63f3c1b5d58b97ff02ca0490214a021ed7d99b93867839c',
            receiptsRoot: '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
            signer: '0x0000000000000000000000000000000000000000',
            transactions: []
        }
    }
]

const defaultEnv: Environment = {
    user: '0xa4aDAfAef9Ec07BC4Dc6De146934C7119341eE25',
    network: networkConfigs[0]
}
