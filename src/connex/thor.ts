import * as WebSocket from 'ws'
import Endpoint from './endpoint'
import Thor = Connex.Thor
import { abi } from 'thor-devkit'


export function createThor(
    baseURL: string,
    genesis: string): Thor {
    const ep = new Endpoint(baseURL)
    return {
        get genesis() { return genesis },
        nextTick() { return {} as any },
        account(
            addr: string,
            revision?: string | number) {
            return createAccountVisitor(ep, addr, revision)
        },
        block(revision: string | number) {
            return createBlockVisitor(ep, revision)
        },
        transaction(
            id: string,
            head?: string) {
            return createTxVisitor(ep, id, head)
        },
        filter<T extends 'event' | 'transfer'>(
            kind: T,
            criteriaSet: Array<Thor.Criteria<T>>) {
            return createFilter(ep, kind, criteriaSet)
        },
        subscribe<T extends 'event' | 'transfer' | 'block'>(
            subject: T,
            criteria: Thor.Criteria<T>
        ) {
            return createSubscription(ep, subject, criteria)
        },
        call(
            input: Thor.VMInput,
            revision?: string | number) {
            return ep.post<Thor.VMOutput>(
                `accounts`,
                input,
                { revision })
        },
        commit(rawTx: string) {
            return ep.post<{ id: string }>(
                'transactions',
                { raw: rawTx }
            ).then(r => createTxVisitor(ep, r.id))
        }
    }
}

function createAccountVisitor(
    ep: Endpoint,
    addr: string,
    revision?: string | number) {

    const acc: Thor.AccountVisitor = {
        get address() { return addr },
        get revision() { return revision },
        get() {
            return ep.get<Thor.Account>(
                `accounts/${encodeURIComponent(addr)}`,
                { revision })
        },
        code() {
            return ep.get<{ code: string }>(
                `accounts/${encodeURIComponent(addr)}/code`,
                { revision })
                .then(r => r.code)
        },
        storage(key: string) {
            return ep.get<{ value: string }>(
                `accounts/${encodeURIComponent(addr)}/storage/${encodeURIComponent(key)}`,
                { revision })
                .then(r => r.value)
        },
        call(input: Thor.VMInput) {
            return ep.post<Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision })
        },
        method(abiDef: object) {
            return createMethodVisitor(ep, addr, abiDef, revision)
        },
        event(abiDef: object) {
            return createEventVisitor(ep, abiDef, addr)
        }
    }
    return acc
}

function createBlockVisitor(
    ep: Endpoint,
    revision: string | number
): Thor.BlockVisitor {
    return {
        get revision() { return revision },
        get() {
            return ep.get<Thor.Block & { isTrunk: boolean }>(
                `blocks/${encodeURIComponent(revision + '')}`)
        }
    }
}

function createTxVisitor(
    ep: Endpoint,
    id: string,
    head?: string
): Thor.TransactionVisitor {
    return {
        get id() { return id },
        get head() { return head },
        get() {
            return ep.get<Thor.Transaction & { meta: Thor.Transaction.Meta }>(
                `transactions/${encodeURIComponent(id)}`,
                { head }
            )
        },
        receipt() {
            return ep.get<Thor.Receipt & { meta: Thor.Transaction.Meta }>(
                `transactions/${encodeURIComponent(id)}/receipt`,
                { head }
            )
        }
    }
}

function createFilter<T extends 'event' | 'transfer'>(
    ep: Endpoint,
    kind: T,
    criteriaSet: Array<Thor.Criteria<T>>
): Thor.Filter<T> {

    if (kind !== 'event' && kind !== 'transfer') {
        throw new Error('invalid filter kind')
    }
    const filterBody = {
        range: {
            unit: 'block',
            from: 0,
            to: 2 ** 32 - 1
        },
        options: {
            offset: 0,
            limit: 10
        },
        criteriaSet
    }
    const query = { order: 'asc' }

    const filter: Thor.Filter<T> = {
        get kind() { return kind },
        range(unit: 'block' | 'time', from: number, to: number) {
            filterBody.range = { unit, from, to }
            return filter
        },
        order(order: 'asc' | 'desc') {
            query.order = order
            return filter
        },
        offset(offset: number) {
            filterBody.options.offset = offset
            return filter
        },
        next(limit: number) {
            filterBody.options.limit = limit
            return ep.post<Array<Thor.Log<T>>>(`logs/${kind}`, filter, query)
        }
    }
    return filter
}


function createSubscription<T extends 'event' | 'transfer' | 'block'>(
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

function createMethodVisitor(
    ep: Endpoint,
    addr: string,
    abiDef: object,
    revision?: string | number
): Thor.MethodVisitor {
    const fn = new abi.Function(abiDef as any)
    return {
        asClause(
            args: any[],
            value?: string | number): Thor.Clause {
            const data = fn.encode(...args)
            return {
                to: addr,
                value: value ? value.toString() : '0x0',
                data
            }
        },
        call(
            args: any[],
            value?: string | number,
            caller?: string,
            gas?: number,
            gasPrice?: string
        ) {
            const data = fn.encode(...args)
            const input: Thor.VMInput = {
                value: value ? value.toString() : '0x0',
                data,
                caller,
                gas,
                gasPrice,
            }
            return ep.post<Thor.VMOutput>(
                `accounts/${encodeURIComponent(addr)}`,
                input,
                { revision }).then(output => {
                    const decoded = fn.decode(output.data)
                    return { ...output, decoded }
                })
        }
    }
}

function createEventVisitor(
    ep: Endpoint,
    abiDef: object,
    addr: string): Thor.EventVisitor {

    const ev = new abi.Event(abiDef as any)

    const asCriteria = (indexed: object) => {
        const topics = ev.encode(indexed)
        return {
            address: addr,
            topic0: topics[0] || undefined,
            topic1: topics[1] || undefined,
            topic2: topics[2] || undefined,
            topic3: topics[3] || undefined,
            topic4: topics[4] || undefined
        }
    }
    return {
        asCriteria,
        filter(indexed: object[]) {
            const criteriaSet = indexed.map(i => asCriteria(i))
            const filter = createFilter(ep, 'event', criteriaSet)

            const transformed: Thor.Filter<'decoded-event'> = {
                kind: 'decoded-event',
                range(unit: 'block' | 'time', from: number, to: number) {
                    filter.range(unit, from, to)
                    return transformed
                },
                order(order: 'asc' | 'desc') {
                    filter.order(order)
                    return transformed
                },
                offset(offset: number) {
                    filter.offset(offset)
                    return transformed
                },
                next(limit: number) {
                    return filter
                        .next(limit)
                        .then(events => events.map(e => {
                            const decoded = ev.decode(e.data, e.topics)
                            return { ...e, decoded }
                        }))
                }
            }
            return transformed
        },
        subscribe(indexed: object) {
            const criteria = asCriteria(indexed)
            const sub = createSubscription(ep, 'event', criteria)
            return {
                subject: 'decoded-event',
                next() {
                    return sub
                        .next()
                        .then(m => {
                            const decoded = ev.decode(m.data, m.topics)
                            return { ...m, decoded }
                        })
                },
                unsubscribe() {
                    sub.unsubscribe()
                }
            }
        }
    }
}
