import { Node } from './node'
import { cry } from 'thor-devkit'

export function createClient(node: Node): Client {
    const net = node.net
    return {
        get genesis() { return node.genesis },
        get head() { return node.head },
        get progress() { return node.progress },
        nextTick() { return node.nextTick() },

        explain(
            clauses: Connex.Thor.Clause[],
            options: {
                caller?: string
                gas?: number
                gasPrice?: string
            },
            rev: string) {
            return net.post<Connex.Thor.VMOutput[]>(
                `accounts/*`, {
                    clauses,
                    ...options
                },
                { revision: rev })
                .then(outputs => ({ outputs }))
        },
        getAccount(addr: string, rev: string) {
            return node.cache.getAccount(addr, rev, () => {
                return net.get(
                    `accounts/${encodeURIComponent(addr)}`,
                    { revision: rev }
                )
            })
        },
        getCode(addr: string, rev: string) {
            return net.get<Connex.Thor.Code>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision: rev })
        },
        getStorage(addr: string, key: string, rev: string) {
            return net.get<Connex.Thor.Storage>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision: rev })
        },

        call(
            clause: Connex.Thor.Clause,
            options: {
                caller?: string
                gas?: number
                gasPrice?: string
            },
            rev: string,
            cacheTies?: string[]
        ) {
            const fetch = () => {
                return net.post<Connex.Thor.VMOutput>(
                    clause.to ? `accounts/${encodeURIComponent(clause.to)}` :
                        'accounts',
                    {
                        value: clause.value,
                        data: clause.data,
                        ...options
                    },
                    { revision: rev })
            }
            if (!cacheTies) {
                return fetch()
            }

            const key = cry.blake2b256(JSON.stringify(clause), JSON.stringify(options)).toString('hex')
            return node.cache.call(key, rev, cacheTies, fetch)
        },

        getBlock(rev: string | number) {
            return node.cache.getBlock(rev, () =>
                net.get<Connex.Thor.Block | null>(
                    `blocks/${encodeURIComponent(rev + '')}`)
            )
        },

        getTx(id: string) {
            return node.cache.getTx(id,
                () => net.get<Connex.Thor.Transaction | null>(
                    `transactions/${encodeURIComponent(id)}`))
        },

        getReceipt(id: string) {
            return node.cache.getReceipt(id,
                () => net.get<Connex.Thor.Receipt | null>(
                    `transactions/${encodeURIComponent(id)}/receipt`))
        },

        filter<T extends 'event' | 'transfer'>(kind: T, body: {
            range: Connex.Thor.Filter.Range
            order: 'asc' | 'desc'
            criteriaSet: Array<Connex.Thor.Filter.Criteria<T>>
            options: { offset: number, limit: number }
        }) {
            const key = cry.blake2b256(kind, JSON.stringify(body)).toString('hex')
            const testKeys = () => {
                if (kind === 'event') {
                    return (body.criteriaSet as Connex.Thor.Event.Criteria[])
                        .map(c => {
                            const set: string[] = []
                            if (c.address) { set.push(c.address) }
                            if (c.topic0) { set.push(c.topic0) }
                            if (c.topic1) { set.push(c.topic1) }
                            if (c.topic2) { set.push(c.topic2) }
                            if (c.topic3) { set.push(c.topic3) }
                            if (c.topic4) { set.push(c.topic4) }
                            return set
                        })
                } else {
                    return (body.criteriaSet as Connex.Thor.Transfer.Criteria[])
                        .map(c => {
                            const set: string[] = []
                            if (c.txOrigin) { set.push(c.txOrigin) }
                            if (c.sender) { set.push(c.sender) }
                            if (c.recipient) { set.push(c.recipient) }
                            return set
                        })
                }
            }

            return node.cache.filter(
                key,
                testKeys,
                () => net.post<Connex.Thor.Filter.Result<T>>(`logs/${kind}`, body))
                .then(items => ({ items }))
        },
        beat: b => {
            return node.beat(b)
        },
        txer: {
            send: (id, raw) => {
                node.txQueue.enqueue(id, raw)
            },
            status: id => {
                return node.txQueue.status(id)
            }
        },
        discoverNode: url => Node.discoverNode(url)
    }
}
