import { webContents } from 'electron'
import { Node, createClient } from './node'
import { manageObject } from './manage-object'
import * as log from 'electron-log'

export class Backend {
    private readonly activeNodes = new Map<string, { node: Node, refCount: number }>()
    private readonly connections = new Map<number, { disconnect(): void }>()

    public connect(
        contentsId: number,
        config: NodeConfig
    ): Client {
        const existConn = this.connections.get(contentsId)
        if (existConn) {
            existConn.disconnect()
        }

        const node = this.acquireNode(config)

        const signal = { disconnected: false }

        const contents = webContents.fromId(contentsId)
        const disconnect = () => {
            signal.disconnected = true
            contents.removeListener('did-start-navigation', onDidStartNavigation)
            contents.removeListener('crashed', disconnect)
            contents.removeListener('destroyed', disconnect)
            this.connections.delete(contentsId)

            log.debug('Backend:', 'client disconnected')
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

        log.debug('Backend:', 'client connected')

        return manageObject(createClient(node), signal)
    }

    private nodeKey(config: NodeConfig) {
        return config.genesis.id + '@' + config.url
    }
    private acquireNode(config: NodeConfig) {
        const key = this.nodeKey(config)
        let value = this.activeNodes.get(key)
        if (value) {
            value.refCount++
            log.debug('Backend:', `acquireNode: <${key}> #${value.refCount}`)
        } else {
            value = {
                node: new Node(config),
                refCount: 1
            }
            this.activeNodes.set(key, value)
            log.debug('Backend:', `acquireNode: <${key}> node created`)
        }
        return value.node
    }

    private releaseNode(config: NodeConfig) {
        const key = this.nodeKey(config)
        const value = this.activeNodes.get(key)
        if (value) {
            value.refCount--
            log.debug('Backend:', `releaseNode: <${key}> #${value.refCount}`)
            if (value.refCount === 0) {
                value.node.close()
                this.activeNodes.delete(key)
                // tslint:disable-next-line:no-console
                log.debug('Backend:', `releaseNode: <${key}> node destroyed`)
            }
        } else {
            // tslint:disable-next-line:no-console
            log.warn('Backend:', `releaseNode: <${key}> found`)
        }
    }
}
