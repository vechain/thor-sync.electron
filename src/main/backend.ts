import { create as createConnex } from '@/connex'
import { webContents } from 'electron'
import { Agent } from 'http'
import { NetworkImpl } from './network'

export class Backend {
    public currentEnv = defaultEnv
    private conns: { [index: number]: Connection } = {}

    public connect(webContentsId: number): Connection {
        let conn = this.conns[webContentsId]
        if (!conn) {
            conn = new Connection(this.currentEnv, webContentsId)
            this.conns[webContentsId] = conn
            console.log('Connection created', '#' + webContentsId)
            const wc = webContents.fromId(webContentsId)
            wc.once('destroyed', () => {
                conn.destroy()
                delete this.conns[webContentsId]
                console.log('Connection deleted', '#' + webContentsId)
            })
        }
        console.log('Connection connected', '#' + webContentsId)
        return conn
    }
}

type Environment = {
    user: string
} & NetworkConfig

class Connection {
    private static networks: { [index: string]: Network } = {}
    private network: Network
    private wireAgent?: Agent
    constructor(readonly env: Environment, readonly webContentsId: number) {
        const networkKey = env.genesis.id + env.url
        let network = Connection.networks[networkKey]
        if (!network) {
            network = new NetworkImpl(
                env.url,
                env.genesis)
            Connection.networks[networkKey] = network
        }
        this.network = network
    }

    public createConnex() {
        if (this.wireAgent) {
            this.wireAgent.destroy()
        }

        this.wireAgent = new Agent({
            maxSockets: 20
        })

        return createConnex(
            this.env.user,
            async () => {
                throw new Error('not implemented')
            },
            this.network.withWireAgent(this.wireAgent),
            {
                name: 'thor-sync'
            })
    }

    public destroy() {
        if (this.wireAgent) {
            this.wireAgent.destroy()
            this.wireAgent = undefined
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
    ...networkConfigs[0]
}
