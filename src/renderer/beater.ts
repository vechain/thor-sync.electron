import { remote } from 'electron'
import * as NodeUrl from 'url'

const config = remote.getCurrentWebContents().getWebPreferences().nodeConfig!


const parsed = NodeUrl.parse(NodeUrl.resolve(config.url, `subscriptions/beat?x-genesis-id=${config.genesis.id}`))
parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
const url = NodeUrl.format(parsed)

export function listen(listener: (beat: Beat) => void) {
    const next = () => {
        const head = CLIENT.head
        const now = Date.now()
        if (now - head.timestamp * 1000 > 60 * 1000) {
            setTimeout(next, 2 * 1000)
            return
        }

        const ws = new WebSocket(url + `&pos=${encodeURIComponent(head.parentID)}`)
        let idles = 0

        // ws timeout
        const timer = setInterval(() => {
            idles++
            if (idles > 5) {
                ws.close()
            }
        }, 10 * 1000)

        ws.onopen = ev => {
            // tslint:disable-next-line:no-console
            console.log('websocket open:', ev)
        }
        ws.onmessage = ev => {
            try {
                listener(JSON.parse(ev.data))
                idles = 0
            } catch (err) {
                // tslint:disable-next-line:no-console
                console.warn('websocket message:', ev, 'failed to parse msg data', err)
                ws.close()
            }
        }
        ws.onerror = ev => {
            // tslint:disable-next-line:no-console
            console.warn('websocket error:', ev)
            ws.close()
        }
        ws.onclose = ev => {
            // tslint:disable-next-line:no-console
            console.log('websocket close:', ev)
            setTimeout(next, 20 * 1000)
            clearInterval(timer)
        }
    }
    next()
}


