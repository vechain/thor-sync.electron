import { webContents } from 'electron'
import TxQueue from './tx-queue'
import { Node, Agent } from './node'
import { proxyObject } from '@/common/object-proxy'
import { create as createConnex } from './connex-impl'

export class Backend {
    private readonly activeNodes = new Map<string, { node: Node, refCount: number }>()
    private readonly connections = new Map<number, { disconnect(): void }>()
    private readonly txQueue = new TxQueue()

    public connect(
        contentsId: number,
        config: NodeConfig
    ): { connex: Connex, txer: Txer } {
        const existConn = this.connections.get(contentsId)
        if (existConn) {
            existConn.disconnect()
        }

        const wireAgent = new Agent({ maxSocket: 10 })
        const node = this.acquireNode(config)

        const signal = { disconnected: false }

        const contents = webContents.fromId(contentsId)
        const disconnect = () => {
            signal.disconnected = true
            contents.removeListener('did-start-navigation', onDidStartNavigation)
            contents.removeListener('crashed', disconnect)
            contents.removeListener('destroyed', disconnect)
            this.connections.delete(contentsId)

            wireAgent.destroy()
            // tslint:disable-next-line:no-console
            console.log('connex disconnected')
            this.releaseNode(config)
        }

        const onDidStartNavigation = (ev: Event, url: string, isInPlace: boolean, isMainFrame: boolean) => {
            if (!isInPlace && isMainFrame) {
                disconnect()
            }
        }

        contents.on('did-start-navigation', onDidStartNavigation)
        contents.on('crashed', disconnect)
        contents.on('destroyed', disconnect)
        this.connections.set(contentsId, {
            disconnect
        })
        // tslint:disable-next-line:no-console
        console.log('connex connected')
        return {
            connex: proxyObject(createConnex(contents, node.fork(wireAgent), node.cache), true, signal),
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
