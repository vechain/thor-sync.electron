import { Node } from './node'
import { cry, abi } from 'thor-devkit'

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
            const fetch = () => net.post<Connex.Thor.VMOutput[]>(
                `accounts/*`, {
                    clauses,
                    ...options
                },
                { revision: rev })
                .then(outputs => {
                    outputs = outputs.map(o => {
                        if (o.reverted) {
                            o.decoded = {
                                revertReason: decodeRevertReason(o.data)
                            }
                        }
                        return o
                    })
                    return { outputs }
                })

            const cacheKey = cry.blake2b256(
                'explain',
                JSON.stringify(clauses),
                JSON.stringify(options)
            ).toString('hex')

            return node.cache.generic(cacheKey, rev, fetch)
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
            const fetch = () => net.get<Connex.Thor.Code>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision: rev })

            const cacheKey = cry.blake2b256(
                'getCode',
                addr).toString('hex')

            return node.cache.generic(cacheKey, rev, fetch, [])
        },
        getStorage(addr: string, key: string, rev: string) {
            const fetch = () => net.get<Connex.Thor.Storage>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision: rev })

            const cacheKey = cry.blake2b256(
                'getStorage',
                addr,
                key).toString('hex')

            return node.cache.generic(cacheKey, rev, fetch)
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
                    .then(output => {
                        if (output.reverted) {
                            output.decoded = {
                                revertReason: decodeRevertReason(output.data)
                            }
                        }
                        return output
                    })
            }

            const key = cry.blake2b256(
                'call',
                JSON.stringify(clause),
                JSON.stringify(options),
                cacheTies ? JSON.stringify(cacheTies) : ''
            ).toString('hex')
            return node.cache.generic(key, rev, fetch, cacheTies)
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

// https://solidity.readthedocs.io/en/v0.5.5/control-structures.html#error-handling-assert-require-revert-and-exceptions
// 0x08c379a0
// Function selector for Error(string)

const decoder = new abi.Function({
    name: 'foo',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
})

const errorSig = '0x08c379a0'

function decodeRevertReason(data: string) {
    try {
        if (data.startsWith(errorSig)) {
            return (decoder.decode(data.slice(errorSig.length)) as any)['0']
        }
        return ''
    } catch {
        return ''
    }
}
