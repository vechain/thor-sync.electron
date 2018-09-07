import Thor = Connex.Thor
import Endpoint from './endpoint'
import * as WebSocket from 'ws'

export function create<T extends 'event' | 'transfer' | 'block'>(
    ep: Endpoint,
    subject: T,
    criteria: Thor.Criteria<T>
): Thor.Subscription<T> {
    let query: any
    if (subject === 'block') {
        const c = criteria as Thor.Criteria<'block'>
        query = { pos: c.position }
    } else if (subject === 'event') {
        const c = criteria as Thor.Criteria<'event'>
        query = {
            pos: c.position,
            addr: c.address,
            t0: c.topic0,
            t1: c.topic1,
            t2: c.topic2,
            t3: c.topic3,
            t4: c.topic4
        }
    } else if (subject === 'transfer') {
        const c = criteria as Thor.Criteria<'transfer'>
        query = {
            pos: c.position,
            txOrigin: c.txOrigin,
            sender: c.sender,
            recipient: c.recipient
        }
    } else {
        throw new Error('invalid subject')
    }

    const ws = ep.websocket(`subscriptions/${subject}`, query)
    return {
        get subject() { return subject },
        next() {
            return new Promise<Thor.Subscription.Message<T>>((resolve, reject) => {
                if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
                    return reject(new Error('closing or closed'))
                }
                if ((ws as any)._socket) {
                    (ws as any)._socket.resume()
                }

                const onMsg = (msg: WebSocket.Data) => {
                    if ((ws as any)._socket) {
                        (ws as any)._socket.pause()
                    }
                    try {
                        resolve(JSON.parse(msg.toString()))
                    } catch (err) {
                        reject(err)
                    }
                    ws.removeListener('error', onError)
                    ws.removeListener('close', onClose)
                }
                const onError = (err: Error) => {
                    reject(err)
                    ws.removeListener('message', onMsg)
                    ws.removeListener('close', onClose)
                }
                const onClose = () => {
                    reject(new Error('closed'))
                    ws.removeListener('message', onMsg)
                    ws.removeListener('error', onError)
                }
                ws.once('message', onMsg)
                    .once('error', onError)
                    .once('close', onClose)
            })
        },
        unsubscribe() {
            ws.close()
        }
    }
}
