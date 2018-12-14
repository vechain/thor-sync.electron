import { app, webContents, BrowserWindow, WebContents } from 'electron'
import { create as createThor } from './thor'
import TxQueue from './tx-queue'
import { Node, Agent } from './node'

// tslint:disable-next-line:no-var-requires
const connexVersion = require('@vechain/connex/package.json').version

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
            connex: {
                version: connexVersion,
                thor: createThor(node.fork(wireAgent), node.cache),
                vendor: this.createVendor(contents)
            },
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

    private createVendor(contents: WebContents): Connex.Vendor {
        const windowId = BrowserWindow.fromWebContents(contents.hostWebContents || contents).id
        return {
            sign: kind => {
                if (kind === 'tx') {
                    const opts: SignTx.Options = {}
                    const ss: Connex.Vendor.TxSigningService = {
                        signer(addr) {
                            opts.signer = addr
                            return this
                        },
                        gas(gas) {
                            opts.gas = gas
                            return this
                        },
                        link(url) {
                            opts.link = url
                            return this
                        },
                        comment(text) {
                            opts.comment = text
                            return this
                        },
                        request(msg: Connex.Vendor.SigningService.TxMessage) {
                            return app.vendor[windowId].signTx(
                                contents.id,
                                msg,
                                opts,
                                { url: contents.getURL(), title: contents.getTitle() })
                        }
                    }
                    return ss as any
                }
                throw new Error('unsupported')
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
