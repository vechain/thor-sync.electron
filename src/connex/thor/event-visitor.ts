import Thor = Connex.Thor
import Endpoint from './endpoint'
import { abi } from 'thor-devkit'
import * as Filter from './filter'
import * as Subscription from './subscription'

export function create(
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
            const filter = Filter.create(ep, 'event', criteriaSet)

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
            const sub = Subscription.create(ep, 'event', criteria)
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
