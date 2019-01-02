import { Wire } from './wire'
import { Node } from './node'
import { cry } from 'thor-devkit'

export function createClient(node: Node, wire: Wire): Client {
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
            return wire.post<Connex.Thor.VMOutput[]>(
                `accounts/*`, {
                    clauses,
                    ...options
                },
                { revision: rev })
        },
        getAccount(addr: string, rev: string) {
            return node.cache.getAccount(addr, rev, () => {
                return wire.get(
                    `accounts/${encodeURIComponent(addr)}`,
                    { revision: rev }
                )
            })
        },
        getCode(addr: string, rev: string) {
            return wire.get<Connex.Thor.Code>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision: rev })
        },
        getStorage(addr: string, key: string, rev: string) {
            return wire.get<Connex.Thor.Storage>(
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
            rev: string) {
            return wire.post<Connex.Thor.VMOutput>(
                clause.to ? `accounts/${encodeURIComponent(clause.to)}` :
                    'accounts',
                {
                    value: clause.value,
                    data: clause.data,
                    ...options
                },
                { revision: rev })
        },

        getBlock(rev: string | number) {
            return node.cache.getBlock(rev, () =>
                wire.get<Connex.Thor.Block | null>(
                    `blocks/${encodeURIComponent(rev + '')}`)
            )
        },

        getTx(id: string) {
            return node.cache.getTx(id,
                () => wire.get<Connex.Thor.Transaction | null>(
                    `transactions/${encodeURIComponent(id)}`))
        },

        getReceipt(id: string) {
            return node.cache.getReceipt(id,
                () => wire.get<Connex.Thor.Receipt | null>(
                    `transactions/${encodeURIComponent(id)}/receipt`))
        },

        filter<T extends 'event' | 'transfer'>(kind: T, body: {
            range: Connex.Thor.Filter.Range
            order: 'asc' | 'desc'
            criteriaSet: Array<Connex.Thor.Filter.Criteria<T>>
            options: { offset: number, limit: number }
        }) {
            const key = cry.blake2b256(kind, JSON.stringify(body)).toString('hex')
            const bloomKeys = () => {
                const ks: string[] = []
                if (kind === 'event') {
                    (body.criteriaSet as Connex.Thor.Event.Criteria[])
                        .forEach(c => {
                            if (c.address) { ks.push(c.address) }
                            if (c.topic0) { ks.push(c.topic0) }
                            if (c.topic1) { ks.push(c.topic1) }
                            if (c.topic2) { ks.push(c.topic2) }
                            if (c.topic3) { ks.push(c.topic3) }
                            if (c.topic4) { ks.push(c.topic4) }
                        })
                } else {
                    (body.criteriaSet as Connex.Thor.Transfer.Criteria[])
                        .forEach(c => {
                            if (c.txOrigin) { ks.push(c.txOrigin) }
                            if (c.sender) { ks.push(c.sender) }
                            if (c.recipient) { ks.push(c.recipient) }
                        })
                }
                return ks
            }
            return node.cache.filter(
                key,
                bloomKeys,
                () => wire.post<Connex.Thor.Filter.Result<T>>(`logs/${kind}`, body))
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
