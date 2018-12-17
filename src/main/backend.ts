import { webContents } from 'electron'
import TxQueue from './tx-queue'
import { Node, Agent } from './node'
import { adaptError } from '@/common/adapt-error'
import { create as createConnex } from './connex-impl'

export class Backend {
    private readonly activeNodes = new Map<string, { node: Node, refCount: number }>()
    private readonly txQueue = new TxQueue()

    public connect(
        contentsId: number,
        config: NodeConfig
    ): { connex: Connex, txer: Txer } {
        const wireAgent = new Agent({ maxSocket: 5 })
        const node = this.acquireNode(config)
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
            this.releaseNode(config)
        }
        contents.once('did-start-loading', disconnect)
        contents.once('crashed', disconnect)
        contents.once('destroyed', disconnect)
        return {
            connex: adaptError(createConnex(contents, node.fork(wireAgent), node.cache), true),
            txer: {
                send: (id, raw) => {
                    this.txQueue.enqueue(id, raw, node.innerWire)
                },
                status: id => {
                    return this.txQueue.status(id)
                }
            }
        }
    }

    private nodeKey(config: NodeConfig) {
        return config.genesis.id + '@' + config.url
    }
    private acquireNode(config: NodeConfig) {
        const key = this.nodeKey(config)
        let value = this.activeNodes.get(key)
        if (value) {
            value.refCount++
            // tslint:disable-next-line:no-console
            console.log(`acquireNode: <${key}> #${value.refCount}`)
        } else {
            value = {
                node: new Node(config, new Agent({ maxSocket: 10 })),
                refCount: 1
            }
            this.activeNodes.set(key, value)
            // tslint:disable-next-line:no-console
            console.log(`acquireNode: <${key}> node created`)
        }
        return value.node
    }

    private releaseNode(config: NodeConfig) {
        const key = this.nodeKey(config)
        const value = this.activeNodes.get(key)
        if (value) {
            value.refCount--
            // tslint:disable-next-line:no-console
            console.log(`releaseNode: <${key}> #${value.refCount}`)
            if (value.refCount === 0) {
                value.node.close()
                this.activeNodes.delete(key)
                // tslint:disable-next-line:no-console
                console.log(`releaseNode: <${key}> node destroyed`)
            }
        } else {
            // tslint:disable-next-line:no-console
            console.warn(`releaseNode: <${key}> found`)
        }
    }
}
