import { webContents } from 'electron'

export class MQ {
    private readonly topicToQueue = new Map<string, Array<{}>>()
    private readonly topicToReaderQueue = new Map<string, Reader[]>()
    private readonly managedWebContents = new Set<number>()

    public post(topic: string, payload: {}) {
        const rq = this.topicToReaderQueue.get(topic)
        if (rq && rq.length > 0) {
            rq.shift()!.resolve(payload)
            return
        }
        let q = this.topicToQueue.get(topic)
        if (!q) {
            q = []
            this.topicToQueue.set(topic, q)
        }
        q.push(payload)
    }

    public read(topic: string, contentsId: number): Promise<{}> {
        this.manageWebContents(contentsId)
        return new Promise(resolve => {
            const q = this.topicToQueue.get(topic)
            if (q && q.length > 0) {
                return resolve(q.shift())
            }

            let rq = this.topicToReaderQueue.get(topic)
            if (!rq) {
                rq = []
                this.topicToReaderQueue.set(topic, rq)
            }
            rq.push({ contentsId, resolve })
        })
    }

    public peek(topic: string): {} | null {
        const q = this.topicToQueue.get(topic)
        if (q && q.length > 0) {
            return q.shift()!
        }
        return null
    }

    private manageWebContents(contentsId: number) {
        if (this.managedWebContents.has(contentsId)) {
            return
        }
        const wc = webContents.fromId(contentsId)
        const cleanup = () => {
            wc.removeListener('did-start-navigation', onDidStartNavigation)
            wc.removeListener('crashed', cleanup)
            wc.removeListener('destroyed', cleanup)

            this.topicToReaderQueue.forEach((rq) => {
                const filtered = rq.filter(v => v.contentsId !== contentsId)
                rq.splice(0, rq.length, ...filtered)
            })

            this.managedWebContents.delete(contentsId)
        }

        const onDidStartNavigation = (ev: Event, url: string, isInPlace: boolean, isMainFrame: boolean) => {
            if (!isInPlace && isMainFrame) {
                cleanup()
            }
        }

        wc.on('did-start-navigation', onDidStartNavigation)
        wc.on('crashed', cleanup)
        wc.on('destroyed', cleanup)
        this.managedWebContents.add(contentsId)
    }
}


type Reader = {
    contentsId: number
    resolve: (payload: {}) => void
}
